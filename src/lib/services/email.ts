// Email service — logs in development, sends via Resend in production.
// Full Resend integration will be wired up in Phase 4 (P4-E-04).

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (process.env.NODE_ENV === 'production' && process.env.RESEND_API_KEY) {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: 'BenchBuddy <noreply@benchbuddy.com>',
      to,
      subject,
      html,
    });
    if (error) {
      console.error('Email send error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  } else {
    console.log(
      `\n📧 EMAIL (dev mode)\n  To: ${to}\n  Subject: ${subject}\n  Body: ${html}\n`
    );
  }
}
