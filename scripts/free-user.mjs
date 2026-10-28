// Creates (or resets) a test account that can make decks without paying, by granting it a plan.
// Run: node scripts/free-user.mjs   (uses FREE_USER_EMAIL / FREE_PASSWORD / DATABASE_URL from .env)
// The password is set here directly, so it may be shorter than sign-up's 8-character minimum.
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { hashPassword } from "better-auth/crypto";

const email = process.env.FREE_USER_EMAIL?.toLowerCase();
const password = process.env.FREE_PASSWORD;
if (!email || !password) throw new Error("Set FREE_USER_EMAIL and FREE_PASSWORD in .env");

const sql = neon(process.env.DATABASE_URL);
const hash = await hashPassword(password);
// No subscription id, so there's nothing to cancel at Razorpay; the plan simply runs to periodEnd.
const plan = "ultra", periodEnd = new Date("2099-12-31");

const [user] = await sql`
  INSERT INTO "user" (id, name, email, "emailVerified", plan, "periodEnd", "decksUsed", "slidesUsed", "updatedAt")
  VALUES (${randomUUID()}, ${email.split("@")[0]}, ${email}, true, ${plan}, ${periodEnd}, 0, 0, now())
  ON CONFLICT (email) DO UPDATE SET plan = ${plan}, "periodEnd" = ${periodEnd}, "subscriptionStatus" = NULL,
    "decksUsed" = 0, "slidesUsed" = 0, "updatedAt" = now()
  RETURNING id`;

const updated = await sql`UPDATE account SET password = ${hash}, "updatedAt" = now()
  WHERE "userId" = ${user.id} AND "providerId" = 'credential' RETURNING id`;
if (!updated.length) {
  await sql`INSERT INTO account (id, "accountId", "providerId", "userId", password, "updatedAt")
    VALUES (${randomUUID()}, ${user.id}, 'credential', ${user.id}, ${hash}, now())`;
}
console.log(`Ready: ${email} on the ${plan} plan, usage reset.`);
