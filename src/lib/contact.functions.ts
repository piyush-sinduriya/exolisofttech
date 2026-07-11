import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Resend } from "resend";

const ADMIN_EMAIL = "explisoft@gmail.com";

const ContactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(200),
  mobile: z.string().max(30).optional().default(""),
  company: z.string().max(120).optional().default(""),
  service: z.string().max(80).optional().default(""),
  budget: z.string().max(40).optional().default(""),
  message: z.string().min(10).max(2000),
});

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ContactSchema.parse(data))
  .handler(async ({ data }) => {
    // Short, human-friendly submission ID for support/troubleshooting.
    const submissionId = `LEAD-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`;

    const timestamp = new Date().toISOString();

    // Server-side log — visible in server function logs.
    console.log("[contact] new lead:", {
      submissionId,
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      company: data.company,
      service: data.service,
      budget: data.budget,
      messageLength: data.message.length,
      at: timestamp,
    });

    // Send email notification via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: "Explisoft Website <onboarding@resend.dev>",
          to: [ADMIN_EMAIL],
          subject: `🔔 New Lead: ${data.name} — ${data.service || "General Inquiry"}`,
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #e0e0e0; border-radius: 16px; overflow: hidden; border: 1px solid #222;">
              <div style="background: linear-gradient(135deg, #6366f1, #06b6d4); padding: 24px 32px;">
                <h1 style="margin: 0; font-size: 22px; color: white;">🚀 New Contact Form Submission</h1>
                <p style="margin: 4px 0 0; font-size: 13px; color: rgba(255,255,255,0.8);">Submission ID: ${submissionId}</p>
              </div>
              <div style="padding: 28px 32px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #888; font-size: 13px; width: 130px;">👤 Name</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #222; font-weight: 600; font-size: 15px;">${data.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #888; font-size: 13px;">📧 Email</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #222; font-size: 15px;">
                      <a href="mailto:${data.email}" style="color: #6366f1; text-decoration: none;">${data.email}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #888; font-size: 13px;">📱 Mobile</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #222; font-size: 15px;">
                      ${data.mobile ? `<a href="tel:${data.mobile}" style="color: #06b6d4; text-decoration: none;">${data.mobile}</a>` : '<span style="color: #555;">Not provided</span>'}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #888; font-size: 13px;">🏢 Company</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #222; font-size: 15px;">${data.company || '<span style="color: #555;">Not provided</span>'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #888; font-size: 13px;">🎯 Service</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #222; font-size: 15px; font-weight: 600; color: #6366f1;">${data.service || '<span style="color: #555;">Not specified</span>'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #888; font-size: 13px;">💰 Budget</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #222; font-size: 15px;">${data.budget || '<span style="color: #555;">Not specified</span>'}</td>
                  </tr>
                </table>
                <div style="margin-top: 20px; padding: 16px; background: #111; border-radius: 12px; border: 1px solid #222;">
                  <p style="margin: 0 0 8px; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 1px;">💬 Message</p>
                  <p style="margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
                </div>
              </div>
              <div style="padding: 16px 32px; background: #080808; border-top: 1px solid #222; text-align: center;">
                <p style="margin: 0; font-size: 11px; color: #555;">
                  Received at ${timestamp} · Explisoft Website Contact Form
                </p>
              </div>
            </div>
          `,
        });
        console.log("[contact] email sent to", ADMIN_EMAIL, "for", submissionId);
      } catch (emailErr) {
        // Log error but don't fail the form submission
        console.error("[contact] email send failed:", emailErr);
      }
    } else {
      console.warn("[contact] RESEND_API_KEY not set — email not sent. Lead logged to console only.");
    }

    return { ok: true as const, submissionId, receivedAt: timestamp };
  });

const NewsletterSchema = z.object({ email: z.string().email().max(200) });

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => NewsletterSchema.parse(data))
  .handler(async ({ data }) => {
    const timestamp = new Date().toISOString();
    console.log("[newsletter] subscribe:", data.email, timestamp);

    // Send newsletter subscription notification via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: "Explisoft Website <onboarding@resend.dev>",
          to: [ADMIN_EMAIL],
          subject: `📬 New Newsletter Subscriber: ${data.email}`,
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 500px; margin: 0 auto; background: #0a0a0a; color: #e0e0e0; border-radius: 16px; overflow: hidden; border: 1px solid #222;">
              <div style="background: linear-gradient(135deg, #6366f1, #06b6d4); padding: 20px 28px;">
                <h1 style="margin: 0; font-size: 18px; color: white;">📬 New Newsletter Subscriber</h1>
              </div>
              <div style="padding: 24px 28px; text-align: center;">
                <p style="margin: 0; font-size: 16px; font-weight: 600;">${data.email}</p>
                <p style="margin: 8px 0 0; font-size: 12px; color: #666;">Subscribed at ${timestamp}</p>
              </div>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("[newsletter] email send failed:", emailErr);
      }
    }

    return { ok: true as const };
  });
