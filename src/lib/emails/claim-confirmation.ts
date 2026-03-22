interface ClaimConfirmationEmailData {
  claimerName: string;
  holderName: string;
  team: string;
  opponent: string;
  gameDate: string;
  section: string;
  row: string | null;
  seatCount: number;
  pricePerTicket: number | null;
  myGamesUrl: string;
}

export function buildClaimConfirmationEmail(data: ClaimConfirmationEmailData) {
  const totalCost =
    data.pricePerTicket && data.pricePerTicket > 0
      ? `$${(data.pricePerTicket * data.seatCount).toFixed(2)}`
      : null;

  const subject = `You claimed ${data.team} vs. ${data.opponent} tickets!`;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="margin:0 0 8px">Tickets Claimed!</h2>
      <p style="color:#666;margin:0 0 24px">You're going to the game, ${data.claimerName}!</p>

      <div style="background:#f5f5f5;padding:16px;border-radius:8px">
        <p style="margin:0;font-weight:600">${data.team} vs. ${data.opponent}</p>
        <p style="margin:4px 0 0;color:#666">${data.gameDate}</p>
        <p style="margin:4px 0 0;color:#666">Section ${data.section}${data.row ? `, Row ${data.row}` : ''} · ${data.seatCount} seats</p>
        <p style="margin:8px 0 0;color:#666">Shared by ${data.holderName}</p>
      </div>

      ${
        totalCost
          ? `<div style="background:#fff8e1;padding:12px 16px;border-radius:8px;margin-top:16px">
              <p style="margin:0;font-weight:600">Total: ${totalCost}</p>
              <p style="margin:4px 0 0;color:#666">${data.holderName} will send payment details.</p>
            </div>`
          : `<div style="background:#e8f5e9;padding:12px 16px;border-radius:8px;margin-top:16px">
              <p style="margin:0;font-weight:600;color:#2e7d32">Free — no payment needed</p>
            </div>`
      }

      <div style="margin-top:24px">
        <h3 style="margin:0 0 8px">What happens next:</h3>
        <ol style="color:#444;padding-left:20px">
          ${totalCost ? `<li style="margin-bottom:4px">${data.holderName} will share payment details</li>` : ''}
          <li style="margin-bottom:4px">${data.holderName} will transfer tickets to your email</li>
          <li style="margin-bottom:4px">Accept the transfer in your ticketing app</li>
          <li>Enjoy the game!</li>
        </ol>
      </div>

      <div style="margin-top:24px;text-align:center">
        <a href="${data.myGamesUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600">View My Games</a>
      </div>

      <hr style="border:none;border-top:1px solid #eee;margin:32px 0 16px">
      <p style="color:#999;font-size:12px;margin:0">Sent by BenchBuddy</p>
    </div>
  `;

  return { subject, html };
}
