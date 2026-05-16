/**
 * Playwright result reporter — Phase 4
 *
 * Reads playwright-report/results.json and:
 * 1. Uploads HTML report + screenshots + traces to Vercel Blob
 * 2. Creates a Notion "Verification Runs" page with the full test matrix
 * 3. Creates or updates per-failure Notion tasks (deduped by spec+test name)
 * 4. Posts a PR comment with summary + links
 * 5. Prunes Vercel Blob files older than 30 days
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Client } from '@notionhq/client';
import { put, list, del } from '@vercel/blob';

// ─── Types ───────────────────────────────────────────────

interface TestRawResult {
  status: string;
  retry: number;
  duration: number;
  errors?: { message: string }[];
  attachments?: { name: string; path?: string; contentType: string }[];
}

interface TestCase {
  status: string; // 'expected' | 'unexpected' | 'flaky' | 'skipped'
  results: TestRawResult[];
  location?: { file: string; line: number; column: number };
}

interface Spec {
  title: string;
  ok: boolean;
  tests: TestCase[];
  location?: { file: string; line: number };
}

interface Suite {
  title: string;
  file: string;
  suites?: Suite[];
  specs?: Spec[];
}

interface PlaywrightReport {
  stats: { expected: number; unexpected: number; flaky: number; skipped: number; duration: number };
  suites: Suite[];
}

interface FlatResult {
  file: string;
  title: string;
  status: 'passed' | 'failed' | 'flaky' | 'skipped';
  line: number;
  errorMessage?: string;
  screenshotPath?: string;
  tracePath?: string;
}

// ─── Helpers ─────────────────────────────────────────────

function loadReport(): PlaywrightReport | null {
  const p = path.join(process.cwd(), 'playwright-report', 'results.json');
  if (!fs.existsSync(p)) { console.warn('No results.json found'); return null; }
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function isPassed(t: TestCase): boolean {
  return t.status === 'expected' || t.status === 'passed' || t.results?.[0]?.status === 'passed';
}
function isFailed(t: TestCase): boolean {
  return t.status === 'unexpected' || t.status === 'failed' || t.status === 'timedOut' ||
    t.results?.[0]?.status === 'failed' || t.results?.[0]?.status === 'timedOut';
}

function flattenResults(suites: Suite[]): FlatResult[] {
  const results: FlatResult[] = [];
  function walk(suite: Suite) {
    for (const spec of suite.specs || []) {
      const tests = spec.tests || [];
      const anyPassed = tests.some(isPassed);
      const anyFailed = tests.some(isFailed);
      const flaky = anyPassed && tests.some(t => t.results && t.results.length > 1);
      const status: FlatResult['status'] = anyFailed ? 'failed' : flaky ? 'flaky' : anyPassed ? 'passed' : 'skipped';

      // Find screenshots and traces from failed result attachments
      const failedResult = tests.find(isFailed);
      const attachments = failedResult?.results?.flatMap(r => r.attachments || []) || [];
      const screenshot = attachments.find(a => a.name === 'screenshot' && a.path);
      const trace = attachments.find(a => a.name === 'trace' && a.path);

      results.push({
        file: suite.file || '',
        title: spec.title,
        status,
        line: spec.location?.line || 0,
        errorMessage: failedResult?.results?.[0]?.errors?.[0]?.message?.slice(0, 300),
        screenshotPath: screenshot?.path,
        tracePath: trace?.path,
      });
    }
    for (const sub of suite.suites || []) walk(sub);
  }
  for (const suite of suites) walk(suite);
  return results;
}

function statusEmoji(s: string): string {
  return { passed: '✅', failed: '❌', flaky: '⚠️', skipped: '➖' }[s] ?? '➖';
}

function failureKey(file: string, title: string): string {
  return crypto.createHash('sha1').update(`${file}:${title}`).digest('hex').slice(0, 12);
}

// ─── Vercel Blob ──────────────────────────────────────────

async function uploadArtifacts(prNumber: string, commitSha: string): Promise<{ reportUrl?: string; screenshotUrls: Record<string, string> }> {
  if (!process.env.VERCEL_BLOB_RW_TOKEN) return { screenshotUrls: {} };

  const prefix = `e2e/pr-${prNumber}-${commitSha}`;
  const screenshotUrls: Record<string, string> = {};
  let reportUrl: string | undefined;

  // Upload HTML report index
  const reportIndexPath = path.join(process.cwd(), 'playwright-report', 'index.html');
  if (fs.existsSync(reportIndexPath)) {
    const blob = await put(`${prefix}/index.html`, fs.readFileSync(reportIndexPath), {
      access: 'public', contentType: 'text/html',
    });
    reportUrl = blob.url;
  }

  // Upload screenshots from test-results/
  const testResultsDir = path.join(process.cwd(), 'test-results');
  if (fs.existsSync(testResultsDir)) {
    const walkDir = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walkDir(full);
        else if (entry.name.endsWith('.png') || entry.name.endsWith('.zip')) {
          const rel = path.relative(testResultsDir, full);
          put(`${prefix}/artifacts/${rel}`, fs.readFileSync(full), {
            access: 'public',
            contentType: entry.name.endsWith('.zip') ? 'application/zip' : 'image/png',
          }).then(blob => {
            screenshotUrls[full] = blob.url;
          }).catch(() => {});
        }
      }
    };
    walkDir(testResultsDir);
    // Give uploads a moment to complete
    await new Promise(r => setTimeout(r, 3000));
  }

  return { reportUrl, screenshotUrls };
}

async function pruneOldBlobs() {
  if (!process.env.VERCEL_BLOB_RW_TOKEN) return;
  try {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const { blobs } = await list({ prefix: 'e2e/' });
    const old = blobs.filter(b => new Date(b.uploadedAt).getTime() < thirtyDaysAgo);
    if (old.length > 0) {
      await del(old.map(b => b.url));
      console.log(`Pruned ${old.length} blobs older than 30 days.`);
    }
  } catch (err) {
    console.warn('Blob pruning failed (non-fatal):', err);
  }
}

// ─── Notion ──────────────────────────────────────────────

async function upsertFailureTask(
  notion: Client,
  tasksDbId: string,
  result: FlatResult,
  prNumber: string,
  commitSha: string,
  screenshotUrl: string | undefined,
  reportUrl: string | undefined,
  githubRepo: string,
) {
  const key = failureKey(result.file, result.title);
  const specFile = result.file.replace(/^.*e2e\/specs\//, 'e2e/specs/');
  const specRef = result.line ? `${specFile}:${result.line}` : specFile;
  const prUrl = `https://github.com/${githubRepo}/pull/${prNumber}`;

  const claudePrompt = `Investigate this E2E test failure.

Spec: ${specRef}
Test: ${result.title}
PR: ${prUrl}
Commit: ${commitSha}${screenshotUrl ? `\nScreenshot: ${screenshotUrl}` : ''}${reportUrl ? `\nReport: ${reportUrl}` : ''}

Error: ${result.errorMessage || '(see report)'}

To reproduce locally:
  npx playwright test "${specRef}" --headed --debug

Steps:
1. Run the command above to reproduce
2. Check what the test expected vs what it received
3. Fix the underlying app issue (not the test)`;

  // Search for existing open task with this failure key (using raw API — SDK v5 lacks databases.query)
  try {
    const queryRes = await fetch(`https://api.notion.com/v1/databases/${tasksDbId}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NOTION_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        filter: {
          and: [
            { property: 'Notes', rich_text: { contains: `e2e-key:${key}` } },
          ],
        },
        page_size: 1,
      }),
    });
    const existing = await queryRes.json() as { results: { id: string }[] };

    if (existing.results.length > 0) {
      const pageId = existing.results[0].id;
      await notion.comments.create({
        parent: { page_id: pageId },
        rich_text: [{
          text: { content: `Reproduced on PR #${prNumber} (${commitSha.slice(0, 7)}) — ${new Date().toISOString().slice(0, 10)}${screenshotUrl ? `\nScreenshot: ${screenshotUrl}` : ''}` },
        }],
      });
      console.log(`Updated existing failure task for: ${result.title}`);
      return;
    }
  } catch {
    // Query failed — create a new task anyway
  }

  // Create a new failure task
  try {
    await notion.pages.create({
      parent: { database_id: tasksDbId },
      properties: {
        Task: { title: [{ text: { content: `E2E failure: ${result.title}` } }] },
        Status: { status: { name: 'In Progress' } },
        Area: { select: { name: 'Business' } },
        Owner: { select: { name: 'Claude Code' } },
        Priority: { select: { name: 'P1 - Urgent' } },
        Notes: { rich_text: [{ text: { content: `e2e-key:${key}` } }] },
      },
      children: [
        {
          object: 'block', type: 'heading_2',
          heading_2: { rich_text: [{ text: { content: 'Failure Details' } }] },
        },
        {
          object: 'block', type: 'code',
          code: { language: 'plain text', rich_text: [{ text: { content: claudePrompt } }] },
        },
        ...(screenshotUrl ? [{
          object: 'block' as const, type: 'paragraph' as const,
          paragraph: { rich_text: [{ text: { content: `Screenshot: ${screenshotUrl}`, link: { url: screenshotUrl } } }] },
        }] : []),
      ],
    });
    console.log(`Created failure task for: ${result.title}`);
  } catch (err) {
    console.warn(`Failed to create task for ${result.title}:`, err);
  }
}

// ─── Main ────────────────────────────────────────────────

async function main() {
  const report = loadReport();
  if (!report) process.exit(0);

  const passed = report.stats.expected ?? 0;
  const failed = report.stats.unexpected ?? 0;
  const flaky = report.stats.flaky ?? 0;
  const total = passed + failed + flaky + (report.stats.skipped ?? 0);

  if (total === 0) { console.log('No tests ran — skipping reporter.'); process.exit(0); }

  const overall = failed > 0 ? 'FAIL' : flaky > 0 ? 'AT RISK' : 'PASS';
  const results = flattenResults(report.suites);
  const failures = results.filter(r => r.status === 'failed' || r.status === 'flaky');

  const prNumber = process.env.PR_NUMBER || 'N/A';
  const branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || 'unknown';
  const commitSha = (process.env.GITHUB_SHA || 'local').slice(0, 7);
  const runDate = new Date().toISOString().slice(0, 10);
  const githubRepo = process.env.GITHUB_REPOSITORY || '';
  const title = `BenchBuddy PR #${prNumber} — ${runDate} — ${passed} passed, ${failed} failed`;

  console.log(`\n${overall}: ${passed} passed / ${failed} failed / ${flaky} flaky (${total} total)\n`);

  // Upload artifacts to Vercel Blob
  let reportUrl: string | undefined;
  let screenshotUrls: Record<string, string> = {};
  if (process.env.VERCEL_BLOB_RW_TOKEN) {
    console.log('Uploading artifacts to Vercel Blob...');
    ({ reportUrl, screenshotUrls } = await uploadArtifacts(prNumber, commitSha));
    await pruneOldBlobs();
  }

  // Build matrix table
  const matrixRows = results.map(r => {
    const screenshot = r.screenshotPath ? screenshotUrls[r.screenshotPath] : undefined;
    const screenshotLink = screenshot ? ` ([screenshot](${screenshot}))` : '';
    return `| ${statusEmoji(r.status)} | ${r.title}${screenshotLink} | ${r.file} |`;
  }).join('\n');

  const body = [
    `## Result: ${overall}`,
    '',
    `| Status | Test | File |`,
    `|--------|------|------|`,
    matrixRows,
    '',
    `**Branch:** ${branch}  `,
    `**Commit:** ${commitSha}  `,
    `**Run date:** ${runDate}`,
    reportUrl ? `**Full report:** [View HTML report](${reportUrl})` : '',
  ].filter(Boolean).join('\n');

  // ─── Notion verification page ─────────────────────────

  const notion = process.env.NOTION_API_TOKEN ? new Client({ auth: process.env.NOTION_API_TOKEN }) : null;
  const verificationDbId = process.env.NOTION_VERIFICATION_DB_ID;
  const tasksDbId = process.env.NOTION_TASKS_DB_ID;
  let notionPageUrl: string | undefined;

  if (notion && verificationDbId) {
    try {
      const page = await notion.pages.create({
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
          ...(reportUrl ? { 'Report URL': { url: reportUrl } } : {}),
        },
        children: [
          { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ text: { content: body } }] } },
        ],
      });
      notionPageUrl = `https://www.notion.so/${page.id.replace(/-/g, '')}`;
      console.log(`Created Notion verification page: ${notionPageUrl}`);
    } catch (err) {
      console.warn('Failed to create Notion page:', err);
    }

    // Create/update per-failure tasks
    if (tasksDbId && failures.length > 0) {
      console.log(`Processing ${failures.length} failure(s) for Notion tasks...`);
      for (const failure of failures) {
        const screenshotUrl = failure.screenshotPath ? screenshotUrls[failure.screenshotPath] : undefined;
        await upsertFailureTask(notion, tasksDbId, failure, prNumber, commitSha, screenshotUrl, reportUrl, githubRepo);
      }
    }
  }

  // ─── PR comment ──────────────────────────────────────

  const githubToken = process.env.GITHUB_TOKEN;
  if (githubToken && githubRepo && prNumber !== 'N/A') {
    const lines = [
      `## E2E Results: ${overall}`,
      '',
      `${passed} passed · ${failed} failed · ${flaky} flaky`,
      '',
      results.map(r => `- ${statusEmoji(r.status)} ${r.title}`).join('\n'),
      '',
      ...(reportUrl ? [`📊 [Full HTML Report](${reportUrl})`] : []),
      ...(notionPageUrl ? [`📋 [Notion Verification Page](${notionPageUrl})`] : []),
    ];

    try {
      await fetch(`https://api.github.com/repos/${githubRepo}/issues/${prNumber}/comments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${githubToken}`, 'Content-Type': 'application/json', Accept: 'application/vnd.github+json' },
        body: JSON.stringify({ body: lines.join('\n') }),
      });
      console.log('Posted PR comment.');
    } catch (err) {
      console.warn('Failed to post PR comment:', err);
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
