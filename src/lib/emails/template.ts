const LOGO_URL = 'https://getbenchbuddy.com/benchbuddy-lockup-white.svg';
const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;

export function emailChrome(bodyHtml: string, footerText: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#F5F4F2;font-family:${FONT};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#F5F4F2;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background-color:#FFFFFF;">

  <tr><td bgcolor="#2C2A2B" style="background-color:#2C2A2B;padding:18px 32px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td valign="middle"><img src="${LOGO_URL}" alt="BenchBuddy" width="156" height="26" style="display:block;" /></td>
    </tr></table>
  </td></tr>

  <tr><td bgcolor="#E5AB00" style="background-color:#E5AB00;height:3px;line-height:3px;font-size:1px;">&nbsp;</td></tr>

  <tr><td style="padding:28px 32px 36px;">
    ${bodyHtml}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:32px;border-top:1px solid #DCD7D4;">
      <tr><td style="font-size:12px;color:#8E8985;line-height:1.5;padding-top:18px;font-family:${FONT};">${footerText}</td></tr>
    </table>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export function greeting(firstName: string, message: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
  <tr><td style="font-size:16px;font-weight:700;color:#1B1716;padding-bottom:4px;font-family:${FONT};">Hi ${firstName},</td></tr>
  <tr><td style="font-size:15px;color:#1B1716;line-height:1.55;padding-bottom:4px;font-family:${FONT};">${message}</td></tr>
</table>`;
}

export function gameDetailBlock(dayStr: string, opponent: string, timeVenue: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;">
  <tr><td style="border-left:3px solid #E5AB00;padding-left:16px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr><td style="font-size:13px;color:#8E8985;font-family:${FONT};padding-bottom:2px;">${dayStr}</td></tr>
      <tr><td style="font-size:16px;font-weight:700;color:#1B1716;font-family:${FONT};padding-bottom:2px;">vs ${opponent}</td></tr>
      <tr><td style="font-size:14px;color:#8E8985;font-family:${FONT};">${timeVenue}</td></tr>
    </table>
  </td></tr>
</table>`;
}

export function ctaButton(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
  <tr><td align="center" bgcolor="#2C2A2B" style="background-color:#2C2A2B;border-radius:8px;">
    <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:42px;v-text-anchor:middle;width:200px;" arcsize="19%" fillcolor="#2C2A2B" stroke="f"><w:anchorlock/><center style="color:#FFFFFF;font-family:sans-serif;font-size:14px;font-weight:600;">${label}</center></v:roundrect><![endif]-->
    <!--[if !mso]><!--><a href="${url}" style="display:inline-block;background-color:#2C2A2B;color:#FFFFFF;font-family:${FONT};font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">${label}</a><!--<![endif]-->
  </td></tr>
</table>`;
}

export function detailRow(label: string, value: string): string {
  return `<tr><td style="font-size:13px;color:#8E8985;font-family:${FONT};padding-bottom:2px;">${label}</td></tr>
<tr><td style="font-size:14px;font-weight:600;color:#1B1716;font-family:${FONT};padding-bottom:6px;">${value}</td></tr>`;
}

export function bodyText(text: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
  <tr><td style="font-size:14px;color:#8E8985;line-height:1.5;font-family:${FONT};">${text}</td></tr>
</table>`;
}
