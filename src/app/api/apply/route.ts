import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { BUSINESS } from "@/components/creator/business";

/*
  Where a creator's request goes. Set APPLY_WEBHOOK_URL (Zapier, Make, a Google Apps Script, Slack…)
  and every request is POSTed there as JSON. Without it, local dev saves each request to .submissions/
  and a deployment only logs the answers (no screenshots, only file names), so the flow can be clicked through end to end.
*/

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const text = (v: unknown, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const isShot = (v: unknown): v is string => typeof v === "string" && v.startsWith("data:image/") && v.length < 4_000_000;
/* the optional "show them your work" files from the last step: images or PDFs, at most three */
const isFile = (v: unknown): v is { name: string; url: string } => {
  const f = v as { name?: unknown; url?: unknown } | null;
  return !!f && typeof f.name === "string" && typeof f.url === "string" && /^data:(image\/[\w.+-]+|application\/pdf);base64,/.test(f.url) && f.url.length < 3_500_000;
};

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  /* the business's own questions from Customize, as asked and as answered */
  const answers = Array.isArray(body.answers)
    ? body.answers.slice(0, 5).map((x: { question?: unknown; answer?: unknown }) => ({ question: text(x?.question, 200), answer: text(x?.answer) })).filter((x) => x.question)
    : [];
  const request = {
    business: BUSINESS.handle,
    instagram: text(body.handle, 60).replace(/^@+/, ""),
    create: text(body.create),
    want: text(body.want),
    paid: body.paid === "yes",
    range: body.paid === "yes" ? text(body.range, 40) : "",
    /* "local": where they're based; "shipping": the full address, also split into its parts below */
    addressType: body.kind === "shipping" ? "shipping" : "local",
    based: text(body.based, 300),
    street: text(body.street, 200),
    apt: text(body.apt, 100),
    city: text(body.city, 100),
    region: text(body.region, 100),
    postcode: text(body.postcode, 20),
    country: text(body.country, 60),
    firstName: text(body.first, 80),
    lastName: text(body.last, 80),
    email: text(body.email, 200),
    phone: text(body.phone, 40),
    extra: text(body.extra),
    answers,
    submittedAt: new Date().toISOString(),
  };
  const screenshots = Array.isArray(body.screenshots) ? body.screenshots.filter(isShot).slice(0, 3) : [];
  const files = Array.isArray(body.files) ? body.files.filter(isFile).slice(0, 3).map((f) => ({ name: text(f.name, 120), url: f.url })) : [];

  if (!request.instagram || !request.create || !request.want || !request.based || (request.addressType === "shipping" && (!request.street || !request.city || !request.postcode || !request.country)) || !request.firstName || !request.lastName || !EMAIL.test(request.email) || screenshots.length < 3) {
    return Response.json({ error: "Missing answers" }, { status: 400 });
  }

  const hook = process.env.APPLY_WEBHOOK_URL;
  if (hook) {
    const res = await fetch(hook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...request, screenshots, files }) }).catch(() => null);
    if (!res?.ok) {
      console.error(`[apply] webhook failed (${res?.status ?? "network"}) for @${request.instagram}`);
      return Response.json({ error: "Couldn't save" }, { status: 502 });
    }
    return Response.json({ ok: true });
  }

  if (process.env.NODE_ENV !== "production") {
    const dir = path.join(process.cwd(), ".submissions");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, `${Date.now()}-${request.instagram}.json`), JSON.stringify({ ...request, screenshots, files }, null, 2));
    return Response.json({ ok: true });
  }

  console.warn("[apply] APPLY_WEBHOOK_URL is not set; logging the request instead of saving it", { ...request, files: files.map((f) => f.name) });
  return Response.json({ ok: true });
}
