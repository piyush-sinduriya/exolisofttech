import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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
    // Server-side log — visible in server function logs.
    // TODO: persist to DB / send email once Lovable Cloud is enabled.
    console.log("[contact] new lead:", {
      submissionId,
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      company: data.company,
      service: data.service,
      budget: data.budget,
      messageLength: data.message.length,
      at: new Date().toISOString(),
    });
    // Simulate work; also gives real network latency to UI.
    await new Promise((r) => setTimeout(r, 250));
    return { ok: true as const, submissionId, receivedAt: new Date().toISOString() };
  });

const NewsletterSchema = z.object({ email: z.string().email().max(200) });

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => NewsletterSchema.parse(data))
  .handler(async ({ data }) => {
    console.log("[newsletter] subscribe:", data.email, new Date().toISOString());
    await new Promise((r) => setTimeout(r, 200));
    return { ok: true as const };
  });
