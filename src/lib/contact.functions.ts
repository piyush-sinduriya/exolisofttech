import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Resend } from "resend";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.TO_EMAIL || "explisoft@gmail.com";
const FROM_EMAIL = process.env.FROM_EMAIL || "Explisoft Website <onboarding@resend.dev>";
const CLIENT_FROM_EMAIL = process.env.CLIENT_FROM_EMAIL || process.env.FROM_EMAIL || "Explisoft Technology <onboarding@resend.dev>";

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

    // 1. Google Sheets + Apps Script Integration (SMTP-free way using user's Gmail account)
    const googleSheetUrl = process.env.GOOGLE_SHEET_WEBAPP_URL;
    let sheetSubmissionId = submissionId;
    if (googleSheetUrl) {
      try {
        const response = await fetch(googleSheetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            mobile: data.mobile,
            company: data.company,
            service: data.service,
            budget: data.budget,
            message: data.message,
          }),
        });
        const resJson = await response.json() as { ok: boolean; submissionId?: string; error?: string };
        if (resJson && resJson.ok) {
          console.log("[contact] lead successfully processed by Google Sheet Script:", resJson.submissionId);
          if (resJson.submissionId) {
            sheetSubmissionId = resJson.submissionId;
          }
        } else {
          console.error("[contact] Google Sheet Script returned error:", resJson.error);
        }
      } catch (err) {
        console.error("[contact] Google Sheet WebApp request failed, falling back to Resend:", err);
      }
    }

    // 2. Send email notification via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);

        // 1. Send Admin Notification Email
        try {
          await resend.emails.send({
            from: FROM_EMAIL,
            to: [ADMIN_EMAIL],
            subject: `🔔 New Lead: ${data.name} — ${data.service || "General Inquiry"}`,
            html: `
              <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #e0e0e0; border-radius: 16px; overflow: hidden; border: 1px solid #222;">
                <div style="background: linear-gradient(135deg, #6366f1, #06b6d4); padding: 24px 32px;">
                  <h1 style="margin: 0; font-size: 22px; color: white;">🚀 New Contact Form Submission</h1>
                  <p style="margin: 4px 0 0; font-size: 13px; color: rgba(255,255,255,0.8);">Submission ID: ${sheetSubmissionId}</p>
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
          console.log("[contact] admin email sent to", ADMIN_EMAIL, "for", sheetSubmissionId);
        } catch (adminEmailErr) {
          console.error("[contact] admin notification email send failed:", adminEmailErr);
        }

        // 2. Send Client Auto-Reply Email
        try {
          await resend.emails.send({
            from: CLIENT_FROM_EMAIL,
            to: [data.email],
            subject: `✨ Explisoft — Thank you for your inquiry, ${data.name}!`,
            html: `
              <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b0c10; color: #c5c6c7; border-radius: 16px; overflow: hidden; border: 1px solid #1f2833; box-shadow: 0 10px 30px rgba(0,0,0,0.55);">
                <!-- Header / Banner -->
                <div style="background: linear-gradient(135deg, #7c3aed, #06b6d4); padding: 40px 32px; text-align: center; border-bottom: 2px solid #1f2833;">
                  <img src="https://raw.githubusercontent.com/piyush-sinduriya/exolisofttech/main/src/assets/logo.png" alt="Explisoft" style="height: 48px; width: auto; margin-bottom: 16px;" />
                  <h1 style="margin: 0; font-size: 24px; color: #ffffff; font-weight: 700; letter-spacing: -0.5px;">We've Received Your Request!</h1>
                  <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.85);">Let's build something extraordinary together.</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 32px 32px 24px;">
                  <h2 style="margin: 0 0 16px; font-size: 18px; color: #ffffff; font-weight: 600;">Hi ${data.name},</h2>
                  <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #a4a6b0;">
                    Thank you for reaching out to <b>Explisoft Technology</b>! We are excited about the opportunity to partner with you and help scale your business.
                  </p>
                  <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #a4a6b0;">
                    Our team is currently analyzing your project details. We will contact you within the next 24 hours to schedule your <b>free 30-minute strategy call</b> and share a custom growth roadmap.
                  </p>
                  
                  <!-- Client Details Box -->
                  <div style="background-color: #12141c; border-radius: 12px; padding: 24px; border: 1px solid #1f2833; margin-bottom: 28px;">
                    <h3 style="margin: 0 0 16px; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; color: #06b6d4; font-weight: 700;">Summary of Your Details</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                      <tr>
                        <td style="padding: 8px 0; color: #6f727d; width: 120px;">👤 Name:</td>
                        <td style="padding: 8px 0; color: #ffffff; font-weight: 600;">${data.name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6f727d;">📧 Email:</td>
                        <td style="padding: 8px 0; color: #ffffff;">${data.email}</td>
                      </tr>
                      ${data.mobile ? `
                      <tr>
                        <td style="padding: 8px 0; color: #6f727d;">📱 Mobile:</td>
                        <td style="padding: 8px 0; color: #ffffff;">${data.mobile}</td>
                      </tr>` : ''}
                      ${data.company ? `
                      <tr>
                        <td style="padding: 8px 0; color: #6f727d;">🏢 Company:</td>
                        <td style="padding: 8px 0; color: #ffffff;">${data.company}</td>
                      </tr>` : ''}
                      <tr>
                        <td style="padding: 8px 0; color: #6f727d;">🎯 Service:</td>
                        <td style="padding: 8px 0; color: #7c3aed; font-weight: 600;">${data.service || 'General Inquiry'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6f727d;">💰 Budget:</td>
                        <td style="padding: 8px 0; color: #ffffff;">${data.budget || 'Not specified'}</td>
                      </tr>
                    </table>
                    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #1f2833;">
                      <span style="display: block; font-size: 12px; color: #6f727d; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">💬 Project Description:</span>
                      <p style="margin: 0; color: #d1d2d6; line-height: 1.5; font-style: italic;">"${data.message}"</p>
                    </div>
                  </div>

                  <!-- Next Steps Section -->
                  <div style="margin-bottom: 28px;">
                    <h3 style="margin: 0 0 16px; font-size: 15px; color: #ffffff; font-weight: 600;">What Happens Next?</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 14px;">
                      <tr>
                        <td style="vertical-align: top; width: 36px; padding: 4px 0;">
                          <div style="background: linear-gradient(135deg, #7c3aed, #06b6d4); color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold;">1</div>
                        </td>
                        <td style="vertical-align: top; padding: 4px 0; color: #a4a6b0;">
                          <b>Requirement Audit:</b> We review your answers and current online presence.
                        </td>
                      </tr>
                      <tr>
                        <td style="vertical-align: top; width: 36px; padding: 8px 0 4px 0;">
                          <div style="background: linear-gradient(135deg, #7c3aed, #06b6d4); color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold;">2</div>
                        </td>
                        <td style="vertical-align: top; padding: 8px 0 4px 0; color: #a4a6b0;">
                          <b>Strategy Session:</b> We discuss layout goals, custom design preferences, and timeline.
                        </td>
                      </tr>
                      <tr>
                        <td style="vertical-align: top; width: 36px; padding: 8px 0 4px 0;">
                          <div style="background: linear-gradient(135deg, #7c3aed, #06b6d4); color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold;">3</div>
                        </td>
                        <td style="vertical-align: top; padding: 8px 0 4px 0; color: #a4a6b0;">
                          <b>Roadmap Delivery:</b> We provide a tailored growth plan and design proposal.
                        </td>
                      </tr>
                    </table>
                  </div>
                  
                  <!-- WhatsApp Support CTA Button -->
                  <div style="text-align: center; margin: 32px 0 16px;">
                    <a href="https://wa.me/919650680558" target="_blank" style="background: linear-gradient(135deg, #25D366, #128C7E); color: #ffffff; text-decoration: none; padding: 14px 28px; font-size: 15px; font-weight: 700; border-radius: 30px; display: inline-block; box-shadow: 0 4px 15px rgba(37, 211, 102, 0.35);">
                      💬 Chat Directly on WhatsApp
                    </a>
                    <p style="margin: 8px 0 0; font-size: 12px; color: #6f727d;">Have urgent questions? Text us instantly.</p>
                  </div>
                </div>
                
                <!-- Footer -->
                <div style="padding: 24px 32px; background-color: #07080a; border-top: 1px solid #1f2833; text-align: center; font-size: 12px; color: #50525a;">
                  <p style="margin: 0 0 8px; color: #888;"><b>Explisoft Technology</b></p>
                  <p style="margin: 0 0 12px;">Websites · Mobile Apps · AI Automation · Digital Marketing</p>
                  <div style="margin: 12px 0; border-top: 1px dashed #1f2833; padding-top: 12px;">
                    📞 +91 9650680558 · +91 7283038128<br />
                    📧 <a href="mailto:${ADMIN_EMAIL}" style="color: #06b6d4; text-decoration: none;">${ADMIN_EMAIL}</a>
                  </div>
                  <p style="margin: 8px 0 0; font-size: 10px; color: #444;">
                    © ${new Date().getFullYear()} Explisoft Technology. All rights reserved.
                  </p>
                </div>
              </div>
            `,
          });
          console.log("[contact] client email sent to", data.email, "for", sheetSubmissionId);
        } catch (clientEmailErr) {
          // Log client email error but don't fail the form submission (useful for Sandbox limits)
          console.warn("[contact] client auto-reply email failed to send:", clientEmailErr);
        }
      } catch (clientCreationErr) {
        console.error("[contact] resend client creation failed:", clientCreationErr);
      }
    } else {
      console.warn("[contact] RESEND_API_KEY not set — emails not sent. Lead logged to console only.");
    }

    return { ok: true as const, submissionId: sheetSubmissionId, receivedAt: timestamp };
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
          from: FROM_EMAIL,
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
