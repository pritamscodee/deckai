// One-time setup: creates the monthly Razorpay plans and prints the env vars to add.
// Run: node scripts/razorpay-plans.mjs   (uses RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET from .env)
import "dotenv/config";

const plans = { STARTER: ["DeckAI Starter", 199], PRO: ["DeckAI Pro", 499], ULTRA: ["DeckAI Ultra", 999] }; // keep in step with lib/plans.ts
const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");

for (const [key, [name, rupees]] of Object.entries(plans)) {
  const res = await fetch("https://api.razorpay.com/v1/plans", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ period: "monthly", interval: 1, item: { name, amount: rupees * 100, currency: "INR" } }),
  });
  if (!res.ok) throw new Error(`${key}: ${res.status} ${await res.text()}`);
  console.log(`RAZORPAY_PLAN_${key}=${(await res.json()).id}`);
}
