import { createHmac, timingSafeEqual } from "node:crypto";

// Razorpay's REST API (no SDK needed), authenticated with the key pair.
export async function razorpay<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const key = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: init?.method ?? "GET",
    headers: { Authorization: `Basic ${key}`, "Content-Type": "application/json" },
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
  sameHmac(`${paymentId}|${subscriptionId}`, process.env.RAZORPAY_KEY_SECRET!, signature);

export const verifyWebhook = (rawBody: string, signature: string) =>
  sameHmac(rawBody, process.env.RAZORPAY_WEBHOOK_SECRET!, signature);
