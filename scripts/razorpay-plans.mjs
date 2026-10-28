// One-time setup: creates the monthly Razorpay plans and prints the env vars to add.
// Run: node scripts/razorpay-plans.mjs
// Uses RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET from .env, or the RAZORPAY_LIVE_API_* spelling.
// Plans at Razorpay are permanent once created, so run this once per account.
import "dotenv/config";

const plans = { STARTER: ["DeckAI Starter", 199], PRO: ["DeckAI Pro", 499], ULTRA: ["DeckAI Ultra", 999] }; // keep in step with lib/plans.ts
const id = process.env.RAZORPAY_KEY_ID ?? process.env.RAZORPAY_LIVE_API_KEY;
const secret = process.env.RAZORPAY_KEY_SECRET ?? process.env.RAZORPAY_LIVE_API_SECRET;
if (!id || !secret) throw new Error("Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env first.");
if (id.startsWith("rzp_live_")) console.warn("! Live key: these will be real, chargeable plans.");
const auth = Buffer.from(`${id}:${secret}`).toString("base64");

for (const [key, [name, rupees]] of Object.entries(plans)) {
  const res = await fetch("https://api.razorpay.com/v1/plans", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ period: "monthly", interval: 1, item: { name, amount: rupees * 100, currency: "INR" } }),
  });
  if (!res.ok) throw new Error(`${key}: ${res.status} ${await res.text()}`);
  console.log(`RAZORPAY_PLAN_${key}=${(await res.json()).id}`);
}
