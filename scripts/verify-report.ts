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

interface TestResult {
  title: string[];
  status: 'passed' | 'failed' | 'skipped' | 'timedOut';
  retry: number;
  duration: number;
  errors?: { message: string }[];
}

interface SuiteResult {
  title: string;
  file: string;
  suites?: SuiteResult[];
  specs?: { title: string; tests: TestResult[] }[];
}

interface PlaywrightReport {
  stats: { expected: number; unexpected: number; skipped: number; duration: number };
  suites: SuiteResult[];
}

// ─── Helpers ─────────────────────────────────────────────

function loadReport(): PlaywrightReport {
  const reportPath = path.join(process.cwd(), 'playwright-report', 'results.json');
  if (!fs.existsSync(reportPath)) {
    console.warn('No results.json found — skipping reporter');
    process.exit(0);
  }
  return JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
}

function flattenResults(suites: SuiteResult[]): { file: string; title: string; status: string; flaky: boolean }[] {
  const results: { file: string; title: string; status: string; flaky: boolean }[] = [];
  function walk(suite: SuiteResult) {
    for (const spec of suite.specs || []) {
      const tests = spec.tests || [];
      const passed = tests.some((t) => t.status === 'passed');
      const failed = tests.some((t) => t.status === 'failed' || t.status === 'timedOut');
      const flaky = passed && tests.length > 1;
      const status = failed ? 'failed' : flaky ? 'flaky' : passed ? 'passed' : 'skipped';
      results.push({ file: suite.file || '', title: spec.title, status, flaky });
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
  const results = flattenResults(report.suites);

  const passed = results.filter((r) => r.status === 'passed').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  const flaky = results.filter((r) => r.status === 'flaky').length;
  const overall = failed > 0 ? 'FAIL' : flaky > 0 ? 'AT RISK' : 'PASS';

  const prNumber = process.env.PR_NUMBER || 'N/A';
  const branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || 'unknown';
  const commitSha = (process.env.GITHUB_SHA || 'local').slice(0, 7);
  const runDate = new Date().toISOString().slice(0, 10);
  const title = `BenchBuddy PR #${prNumber} — ${runDate} — ${passed} passed, ${failed} failed`;

  console.log(`\n${overall}: ${passed} passed / ${failed} failed / ${flaky} flaky\n`);

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
    const body = `## E2E Results: ${overall}\n\n${passed} passed · ${failed} failed · ${flaky} flaky\n\n${results.map((r) => `- ${statusEmoji(r.status)} ${r.title}`).join('\n')}`;

    try {
      await fetch(`https://api.github.com/repos/${repo}/issues/${prNumber}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github+json',
        },
        body: JSON.stringify({ body }),
      });
      console.log('Posted PR comment.');
    } catch (err) {
      console.warn('Failed to post PR comment:', err);
    }
  }

  // Exit non-zero if tests failed (so the CI job fails)
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
