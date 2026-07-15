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

    // 2. Web3Forms Integration (Easy backup SMTP-free email delivery)
    const web3formsAccessKey = process.env.WEB3FORMS_ACCESS_KEY || "4a4309c7-1846-4142-ba43-4547594f6e0f";
    if (web3formsAccessKey) {
      try {
        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            access_key: web3formsAccessKey,
            subject: `🔔 New Website Lead: ${data.name} — ${data.service || "General Inquiry"}`,
            from_name: "Explisoft Website",
            name: data.name,
            email: data.email,
            mobile: data.mobile || "Not provided",
            company: data.company || "Not provided",
            service: data.service || "General Inquiry",
            budget: data.budget || "Not specified",
            message: data.message,
            submission_id: sheetSubmissionId,
          }),
        });
        const responseText = await response.text();
        try {
          const resJson = JSON.parse(responseText) as { success: boolean; message?: string };
          if (resJson && resJson.success) {
            console.log("[contact] lead successfully processed by Web3Forms");
          } else {
            console.error("[contact] Web3Forms returned error:", resJson.message);
          }
        } catch {
          console.error("[contact] Web3Forms returned non-JSON response:", responseText.slice(0, 200));
        }
      } catch (err) {
        console.error("[contact] Web3Forms request failed:", err);
      }
    }

    // 3. Send email notification via Resend
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

const ChatSchema = z.object({
  message: z.string().max(1000),
  history: z.array(z.object({
    role: z.enum(["user", "model"]),
    text: z.string().max(2000)
  })).optional().default([])
});

export const chatWithAI = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ChatSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const userMessage = data.message.trim();
    const history = data.history;

    // Smart rule-based dialogue engine fallback if API key is not configured yet
    if (!apiKey) {
      const msgLower = userMessage.toLowerCase();
      const words = msgLower.split(/\W+/);
      
      const KNOWLEDGE_BASE = [
        {
          keywords: ["hello", "hi", "hey", "greetings", "namaste", "good morning", "good evening", "yo"],
          response: "Hello! I am the Explisoft AI Assistant. I can answer questions about website development, mobile apps, AI automation, pricing, or help you book a free strategy call. What's on your mind today?"
        },
        {
          keywords: ["website", "web", "design", "development", "developer", "html", "react", "site", "wordpress", "page", "portfolio"],
          response: "Explisoft builds high-performance, premium websites. We specialize in custom React/Vite development, modern landing pages, e-commerce stores, and headless CMS integrations. All websites are fully responsive, super fast, and optimized for SEO. Do you have a specific website project in mind?"
        },
        {
          keywords: ["app", "apps", "mobile", "ios", "android", "react native", "flutter", "phone", "apk", "playstore", "appstore"],
          response: "We develop premium native mobile applications for both iOS and Android platforms using React Native and Flutter. We manage the entire lifecycle from UI/UX design to publishing on the Apple App Store and Google Play Store. What kind of app are you looking to build?"
        },
        {
          keywords: ["automation", "ai", "workflow", "chatbot", "crm", "zapier", "make", "integrate", "bot", "assistant"],
          response: "We build custom AI chatbots, workflow automation pipelines (using Make/Zapier), and CRM integrations that save your business hundreds of hours. We can automate lead generation, customer support, and database synchronization. What manual processes would you like to automate?"
        },
        {
          keywords: ["marketing", "seo", "digital", "ads", "google ads", "facebook ads", "lead", "roi", "sales", "ranking", "rank"],
          response: "Our ROI-driven digital marketing services include SEO (Search Engine Optimization), Google & Meta Ads management, conversion rate optimization, and high-impact lead generation campaigns. We focus on scaling your sales, not just traffic!"
        },
        {
          keywords: ["price", "cost", "pricing", "charge", "rate", "fee", "budget", "quote", "packages", "kitna", "charges", "rupay", "paise", "payment"],
          response: "Since every project is custom-tailored, pricing depends on your requirements. Simple landing pages start around $1,000 (approx. ₹80,000), while complex custom web platforms or mobile apps range from $3,000 to $10,000+. We can work with various budgets—please leave your email/WhatsApp and project details so we can send a custom quote!"
        },
        {
          keywords: ["contact", "phone", "call", "number", "email", "mail", "whatsapp", "address", "location", "office", "delhi", "reach", "laxmi nagar", "connect"],
          response: "You can reach us directly:\n📞 **Phone/WhatsApp:** +91 9650680558 or +91 7283038128\n📧 **Email:** explisoft@gmail.com\n🏢 **Office:** Laxmi Nagar, Delhi, India.\n\nAlternatively, send us your email here and we will reach out to you within 24 hours!"
        },
        {
          keywords: ["how", "process", "steps", "agreement", "timeline", "workflow", "method", "time"],
          response: "Our process is simple and transparent:\n1️⃣ **Strategy Session:** We understand your business goals.\n2️⃣ **Proposal & Design:** We deliver a visual roadmap and pricing.\n3️⃣ **Development & Testing:** We build with weekly updates.\n4️⃣ **Launch & Handover:** We deploy and train your team.\n\nWe usually deliver websites in 2-4 weeks and mobile apps in 6-8 weeks."
        },
        {
          keywords: ["who", "about", "explisoft", "company", "agency", "team", "owner"],
          response: "Explisoft Technology is a premium digital agency based in Delhi, India. We build websites, apps, AI systems, and digital marketing campaigns for ambitious brands worldwide. We are a team of expert developers, designers, and marketing strategists focused on scaling businesses."
        },
        {
          keywords: ["thank", "thanks", "great", "awesome", "perfect", "ok", "okay"],
          response: "You're very welcome! I'm glad I could help. Let me know if you have any other questions about Explisoft, or if you'd like to book a strategy call!"
        }
      ];

      let bestMatch = null;
      let maxScore = 0;

      for (const item of KNOWLEDGE_BASE) {
        let score = 0;
        for (const keyword of item.keywords) {
          if (words.includes(keyword) || msgLower.includes(keyword)) {
            score += 2;
          }
        }
        if (score > maxScore) {
          maxScore = score;
          bestMatch = item;
        }
      }

      const responseText = (bestMatch && maxScore >= 2)
        ? bestMatch.response
        : "I understand your query. Explisoft builds high-performance websites, mobile apps, and custom AI systems. To help you better, could you please drop your email or WhatsApp number here? An expert from our team will contact you directly within 24 hours to discuss!";

      return { text: responseText };
    }

    try {
      const systemInstruction = 
        "You are 'Explisoft AI Assistant', an intelligent, extremely professional, and friendly AI chatbot for Explisoft Technology (explisoft@gmail.com, +91 9650680558). " +
        "Explisoft builds high-performance websites, custom mobile apps, AI automation pipelines, and marketing campaigns. " +
        "Your goal is to answer visitor questions concisely, showcase Explisoft's expertise, and guide users to book a free 30-minute strategy call or fill out the contact form. " +
        "Keep your responses short, under 3-4 sentences, and match our sleek, premium, and friendly tone. Always converse in English or Hindi/Hinglish depending on the user's preference.";

      const contents = [
        ...history.map(h => ({
          role: h.role,
          parts: [{ text: h.text }]
        })),
        {
          role: "user",
          parts: [{ text: userMessage }]
        }
      ];

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.7
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const resJson = await response.json() as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>
          }
        }>
      };

      const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, I could not process your query at this moment. Please feel free to email us at explisoft@gmail.com!";
      return { text };
    } catch (err) {
      console.error("[chat] AI generation error:", err);
      return { text: "I'm having trouble connecting to my AI brain right now. Please message us on WhatsApp (+91 9650680558) or email explisoft@gmail.com for instant help!" };
    }
  });

