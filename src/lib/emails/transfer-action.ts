interface TransferActionEmailData {
  holderName: string;
  claimerName: string;
  claimerEmail: string;
  team: string;
  opponent: string;
  gameDate: string;
  section: string;
  row: string | null;
  seats: string;
  seatCount: number;
  pricePerTicket: number | null;
  platformName: string;
  transferSteps: string[];
  transferDeepLink: string;
  markTransferredUrl: string;
}

export function buildTransferActionEmail(data: TransferActionEmailData) {
  const totalCost =
    data.pricePerTicket && data.pricePerTicket > 0
      ? `$${(data.pricePerTicket * data.seatCount).toFixed(2)}`
      : null;

  const stepsHtml = data.transferSteps
    .map((step, i) => `<li style="margin-bottom:4px">${i + 1}. ${step}</li>`)
    .join('');

  const paymentSection = totalCost
    ? `<div style="background:#fff8e1;padding:12px 16px;border-radius:8px;margin-top:16px">
        <p style="margin:0;font-weight:600">Payment: ${totalCost}</p>
        <p style="margin:4px 0 0;color:#666">Collect payment from ${data.claimerName} via your preferred method.</p>
      </div>`
    : `<div style="background:#e8f5e9;padding:12px 16px;border-radius:8px;margin-top:16px">
        <p style="margin:0;font-weight:600;color:#2e7d32">Free — no payment needed</p>
      </div>`;

  const subject = `Action needed: Transfer ${data.team} vs. ${data.opponent} tickets to ${data.claimerName}`;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="margin:0 0 8px">Tickets Claimed!</h2>
      <p style="color:#666;margin:0 0 24px">${data.claimerName} wants to go to the game. Transfer the tickets to complete the claim.</p>

      <div style="background:#f5f5f5;padding:16px;border-radius:8px">
        <p style="margin:0;font-weight:600">${data.team} vs. ${data.opponent}</p>
        <p style="margin:4px 0 0;color:#666">${data.gameDate}</p>
        <p style="margin:4px 0 0;color:#666">Section ${data.section}${data.row ? `, Row ${data.row}` : ''} · ${data.seatCount} seats</p>
        <p style="margin:8px 0 0"><strong>Transfer to:</strong> ${data.claimerName} (${data.claimerEmail})</p>
      </div>

      ${paymentSection}

      <div style="margin-top:24px">
        <h3 style="margin:0 0 8px">How to transfer (${data.platformName}):</h3>
        <ol style="padding-left:0;list-style:none;margin:0;color:#444">${stepsHtml}</ol>
      </div>

      <div style="margin-top:24px;text-align:center">
        <a href="${data.transferDeepLink}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;margin-right:8px">Transfer Tickets Now</a>
      </div>

      <div style="margin-top:16px;text-align:center">
        <a href="${data.markTransferredUrl}" style="color:#2563eb;text-decoration:underline;font-size:14px">Already transferred? Mark as done</a>
      </div>

      <hr style="border:none;border-top:1px solid #eee;margin:32px 0 16px">
      <p style="color:#999;font-size:12px;margin:0">Sent by BenchBuddy · You received this because ${data.claimerName} claimed your tickets.</p>
    </div>
  `;

  return { subject, html };
}
