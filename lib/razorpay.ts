import { createHmac, timingSafeEqual } from "node:crypto";

// Credentials. The canonical names are RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET; the
// RAZORPAY_LIVE_API_KEY / RAZORPAY_LIVE_API_SECRET spelling is accepted as a fallback so
// an .env written that way keeps working. Resolved per call, never at module load, so a
// missing value is a clear error at the point of use instead of a crash on import.
const required = (name: string, value: string | undefined) => {
  if (!value) throw new Error(`Razorpay is not configured: set ${name} in the environment.`);
  return value;
};

export const keyId = () =>
  required("RAZORPAY_KEY_ID", process.env.RAZORPAY_KEY_ID ?? process.env.RAZORPAY_LIVE_API_KEY);

const keySecret = () =>
  required("RAZORPAY_KEY_SECRET", process.env.RAZORPAY_KEY_SECRET ?? process.env.RAZORPAY_LIVE_API_SECRET);

// Razorpay's REST API (no SDK needed), authenticated with the key pair.
export async function razorpay<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const auth = Buffer.from(`${keyId()}:${keySecret()}`).toString("base64");
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: init?.method ?? "GET",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) throw new Error(`Razorpay ${path} failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

export type Subscription = {
  id: string;
  plan_id: string;
  status: string;
  current_end: number | null;    // unix seconds
  notes: Record<string, string>;
};

const sameHmac = (data: string, secret: string, signature: string) => {
  const expected = Buffer.from(createHmac("sha256", secret).update(data).digest("hex"));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
};

// Checkout returns this signature after the first payment of a subscription.
export const verifyCheckout = (paymentId: string, subscriptionId: string, signature: string) =>
  sameHmac(`${paymentId}|${subscriptionId}`, keySecret(), signature);

// Throws rather than returning false when the secret is missing: a misconfigured webhook
// must not be indistinguishable from a forged one in the logs.
export const verifyWebhook = (rawBody: string, signature: string) =>
  sameHmac(rawBody, required("RAZORPAY_WEBHOOK_SECRET", process.env.RAZORPAY_WEBHOOK_SECRET), signature);
