interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  isMarketing?: boolean;
}

function getUnsubscribeUrl(email: string): string {
  const token = Buffer.from(email + (process.env.NEXTAUTH_SECRET || ''))
    .toString('base64')
    .slice(0, 20);
  return `${process.env.NEXTAUTH_URL}/api/email/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
}

function wrapWithFooter(html: string, to: string, isMarketing: boolean): string {
  const footer = `
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#999">
      <p>BenchBuddy — Your seats. Your friends. Your price.</p>
      ${isMarketing ? `<p><a href="${getUnsubscribeUrl(to)}" style="color:#999">Unsubscribe</a> from marketing emails</p>` : ''}
      <p style="margin-top:8px">BenchBuddy is not affiliated with any sports team, league, or ticketing provider.</p>
    </div>
  `;
  return html + footer;
}

export async function sendEmail({ to, subject, html, isMarketing = false }: SendEmailOptions) {
  const wrappedHtml = wrapWithFooter(html, to, isMarketing);

  if (process.env.NODE_ENV === 'production' && process.env.RESEND_API_KEY) {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: 'BenchBuddy <notifications@getbenchbuddy.com>',
      to,
      subject,
      html: wrappedHtml,
    });
    if (error) {
      console.error('Email send error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  } else {
    console.log(
      `\n📧 EMAIL (dev mode)\n  To: ${to}\n  Subject: ${subject}\n  Body: ${wrappedHtml}\n`
    );
  }
}
