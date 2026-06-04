import MailosaurClient from 'mailosaur';

let client: MailosaurClient | null = null;

function getClient(): MailosaurClient {
  if (!client) {
    const apiKey = process.env.MAILOSAUR_API_KEY;
    if (!apiKey) throw new Error('MAILOSAUR_API_KEY is not set');
    client = new MailosaurClient(apiKey);
  }
  return client;
}

export function mailosaurAddress(prefix: string): string {
  const serverId = process.env.MAILOSAUR_SERVER_ID;
  if (!serverId) throw new Error('MAILOSAUR_SERVER_ID is not set');
  return `${prefix}@${serverId}.mailosaur.net`;
}

export async function waitForEmail(toAddress: string, timeoutMs = 30000) {
  const serverId = process.env.MAILOSAUR_SERVER_ID!;
  return getClient().messages.get(serverId, { sentTo: toAddress }, { timeout: timeoutMs });
}

export function extractMagicLink(emailBody: string): string {
  const match = emailBody.match(/https?:\/\/[^\s"<>]+magic-link[^\s"<>]*/i)
    || emailBody.match(/https?:\/\/[^\s"<>]+verify[^\s"<>]*/i);
  if (!match) throw new Error('No magic link found in email body');
  return match[0];
}
