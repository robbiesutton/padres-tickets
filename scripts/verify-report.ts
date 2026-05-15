/**
 * Playwright result reporter — reads playwright-report/results.json,
 * creates a Notion "Verification Runs" page, posts a PR comment.
 *
 * Phase 1: basic page + PR comment (no failure tasks, no dedup yet)
 * Phase 4: add Vercel Blob upload, failure tasks with dedup logic
 */

import fs from 'fs';
import path from 'path';
import { Client } from '@notionhq/client';

// ─── Types ───────────────────────────────────────────────

interface TestRawResult {
  status: string; // 'passed' | 'failed' | 'timedOut' | 'skipped'
  retry: number;
  duration: number;
  errors?: { message: string }[];
}

interface TestCase {
  // Playwright 1.49+: computed status uses 'expected'/'unexpected'/'flaky'/'skipped'
  // Raw result status (results[0].status) uses 'passed'/'failed'/'timedOut'
  status: string;
  results: TestRawResult[];
}

interface SuiteResult {
  title: string;
  file: string;
  suites?: SuiteResult[];
  specs?: { title: string; ok: boolean; tests: TestCase[] }[];
}

interface PlaywrightStats {
  expected: number;   // tests that passed as expected
  unexpected: number; // tests that failed
  flaky: number;
  skipped: number;
  duration: number;
}

interface PlaywrightReport {
  stats: PlaywrightStats;
  suites: SuiteResult[];
}

// ─── Helpers ─────────────────────────────────────────────

function loadReport(): PlaywrightReport | null {
  const reportPath = path.join(process.cwd(), 'playwright-report', 'results.json');
  if (!fs.existsSync(reportPath)) {
    console.warn('No results.json found — skipping reporter');
    return null;
  }
  return JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
}

function testPassed(t: TestCase): boolean {
  // Playwright 1.49+ computed status: 'expected' means passed as expected
  // Also check raw results[0].status for older formats
  return t.status === 'expected' || t.status === 'passed' ||
    t.results?.[0]?.status === 'passed';
}

function testFailed(t: TestCase): boolean {
  return t.status === 'unexpected' || t.status === 'failed' || t.status === 'timedOut' ||
    t.results?.[0]?.status === 'failed' || t.results?.[0]?.status === 'timedOut';
}

function flattenResults(suites: SuiteResult[]): { file: string; title: string; status: string }[] {
  const results: { file: string; title: string; status: string }[] = [];
  function walk(suite: SuiteResult) {
    for (const spec of suite.specs || []) {
      const tests = spec.tests || [];
      const anyPassed = tests.some(testPassed);
      const anyFailed = tests.some(testFailed);
      // Flaky = passed on retry (more than one result entry, and ultimately passed)
      const flaky = anyPassed && tests.some((t) => t.results && t.results.length > 1);
      const status = anyFailed ? 'failed' : flaky ? 'flaky' : anyPassed ? 'passed' : 'skipped';
      results.push({ file: suite.file || '', title: spec.title, status });
    }
    for (const sub of suite.suites || []) walk(sub);
  }
  for (const suite of suites) walk(suite);
  return results;
}

function statusEmoji(status: string): string {
  return { passed: '✅', failed: '❌', flaky: '⚠️', skipped: '➖' }[status] ?? '➖';
}

// ─── Main ────────────────────────────────────────────────

async function main() {
  const report = loadReport();
  if (!report) process.exit(0);

  // Use stats directly — they're accurate regardless of JSON structure quirks
  const passed = report.stats.expected ?? 0;
  const failed = report.stats.unexpected ?? 0;
  const flaky = report.stats.flaky ?? 0;
  const total = passed + failed + flaky + (report.stats.skipped ?? 0);

  // Skip creating a page if no tests ran (e.g. reporter ran on a failed CI job
  // where Playwright never actually executed)
  if (total === 0) {
    console.log('No tests ran — skipping Notion page creation.');
    process.exit(0);
  }

  const overall = failed > 0 ? 'FAIL' : flaky > 0 ? 'AT RISK' : 'PASS';
  const results = flattenResults(report.suites);

  const prNumber = process.env.PR_NUMBER || 'N/A';
  const branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || 'unknown';
  const commitSha = (process.env.GITHUB_SHA || 'local').slice(0, 7);
  const runDate = new Date().toISOString().slice(0, 10);
  const title = `BenchBuddy PR #${prNumber} — ${runDate} — ${passed} passed, ${failed} failed`;

  console.log(`\n${overall}: ${passed} passed / ${failed} failed / ${flaky} flaky (${total} total)\n`);
  results.forEach((r) => console.log(`  ${statusEmoji(r.status)} ${r.title}`));

  // ─── Notion page ─────────────────────────────────────

  const notionToken = process.env.NOTION_API_TOKEN;
  const verificationDbId = process.env.NOTION_VERIFICATION_DB_ID;

  if (notionToken && verificationDbId) {
    const notion = new Client({ auth: notionToken });

    const matrixRows = results.map((r) =>
      `| ${statusEmoji(r.status)} | ${r.title} | ${r.file} |`
    ).join('\n');

    const body = `## Result: ${overall}\n\n| Status | Test | File |\n|--------|------|------|\n${matrixRows}\n\n**Branch:** ${branch}  \n**Commit:** ${commitSha}  \n**Run date:** ${runDate}`;

    try {
      await notion.pages.create({
        parent: { database_id: verificationDbId },
        properties: {
          title: { title: [{ text: { content: title } }] },
          Status: { select: { name: overall } },
          'PR Number': { number: Number(prNumber) || 0 },
          Branch: { rich_text: [{ text: { content: branch } }] },
          'Commit SHA': { rich_text: [{ text: { content: commitSha } }] },
          'Run Date': { date: { start: runDate } },
          'Pass Count': { number: passed },
          'Fail Count': { number: failed },
        },
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: { rich_text: [{ text: { content: body } }] },
          },
        ],
      });
      console.log('Created Notion verification page.');
    } catch (err) {
      console.warn('Failed to create Notion page:', err);
    }
  }

  // ─── PR comment ──────────────────────────────────────

  const githubToken = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;

  if (githubToken && repo && prNumber !== 'N/A') {
    const commentBody = `## E2E Results: ${overall}\n\n${passed} passed · ${failed} failed · ${flaky} flaky\n\n${results.map((r) => `- ${statusEmoji(r.status)} ${r.title}`).join('\n')}`;

    try {
      await fetch(`https://api.github.com/repos/${repo}/issues/${prNumber}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github+json',
        },
        body: JSON.stringify({ body: commentBody }),
      });
      console.log('Posted PR comment.');
    } catch (err) {
      console.warn('Failed to post PR comment:', err);
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
