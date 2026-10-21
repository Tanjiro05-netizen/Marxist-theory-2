/**
 * Shared email template wrapper for all Marxist.info transactional emails.
 * Provides consistent Obsidian-dark + vermillion branding.
 */

export function emailWrapper(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Marxist.info</title>
</head>
<body style="margin:0; padding:0; background-color:#050507; font-family: 'Georgia', 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#050507;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#0a0a0f; border:1px solid #1a1a2e; border-radius:2px;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 24px 40px; border-bottom: 1px solid #1a1a2e;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin:0; font-size:28px; font-weight:700; color:#dc2626; font-family:'Georgia','Times New Roman',serif; letter-spacing:0.5px;">
                      MARXIST<span style="color:#6b7280;">.</span><span style="color:#e5e7eb;">INFO</span>
                    </h1>
                    <p style="margin:6px 0 0 0; font-size:11px; text-transform:uppercase; letter-spacing:2.5px; color:#4b5563; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                      Theory &middot; Education &middot; Analysis
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 40px 40px 40px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 32px 40px; border-top: 1px solid #1a1a2e;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:12px;">
                    <a href="https://marxist.info" style="color:#dc2626; text-decoration:none; font-size:13px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">marxist.info</a>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="margin:0; font-size:12px; color:#4b5563; line-height:1.6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                      <a href="https://x.com/Leninistwarrior" style="color:#6b7280; text-decoration:none;">Twitter</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:16px;">
                    <p style="margin:0; font-size:11px; color:#374151; line-height:1.5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                      You received this email because you signed up for the Marxist.info waitlist.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function confirmationEmailBody(notifyItems: string[]): string {
  const notifyBlock = notifyItems.length > 0
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#111118; border-left:3px solid #dc2626; border-radius:2px; margin:24px 0;">
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0 0 10px 0; font-size:13px; font-weight:600; color:#d1d5db; text-transform:uppercase; letter-spacing:1px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
              We'll notify you
            </p>
            <ul style="margin:0; padding-left:18px; color:#9ca3af; font-size:14px; line-height:2; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
              ${notifyItems.join('\n              ')}
            </ul>
          </td>
        </tr>
      </table>`
    : '';

  return `
    <h2 style="margin:0 0 16px 0; font-size:22px; font-weight:400; color:#e5e7eb; font-family:'Georgia','Times New Roman',serif;">
      You're on the list.
    </h2>
    <p style="margin:0 0 8px 0; font-size:15px; color:#9ca3af; line-height:1.7; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      Thank you for your interest in <strong style="color:#e5e7eb;">Marxist.info</strong>. 
      You've been added to our waiting list and we'll keep you informed as we build the platform.
    </p>

    ${notifyBlock}

    <p style="margin:24px 0 0 0; font-size:15px; color:#9ca3af; line-height:1.7; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      In the meantime, feel free to browse as a guest at
      <a href="https://marxist.info" style="color:#dc2626; text-decoration:none; font-weight:600;">marxist.info</a>.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:32px 0 0 0;">
      <tr>
        <td style="background-color:#dc2626; border-radius:2px;">
          <a href="https://marxist.info" style="display:inline-block; padding:12px 28px; color:#ffffff; text-decoration:none; font-size:14px; font-weight:600; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; letter-spacing:0.5px;">
            VISIT MARXIST.INFO
          </a>
        </td>
      </tr>
    </table>
  `;
}

export function broadcastEmailBody(htmlContent: string): string {
  return `
    <div style="font-size:15px; color:#d1d5db; line-height:1.7; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      ${htmlContent}
    </div>
  `;
}
