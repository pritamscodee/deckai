import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { resetPasswordEmail, sendEmail } from "@/lib/email";

// better-auth answers "Invalid origin" with a 403 when a request's Origin isn't its baseURL
// (BETTER_AUTH_URL). The site is reachable on the apex, on www and on the vercel.app alias,
// and every preview deploy gets its own hostname, so the alternates must be named.
// BETTER_AUTH_TRUSTED_ORIGINS is a comma-separated list, so origins can be added without a
// code change; VERCEL_URL covers preview deploys automatically.
const trustedOrigins = [
  ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean),
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
];

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // The reset link lands on /reset-password, which posts the token back with the new password.
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      const mail = resetPasswordEmail(user.name ?? "", url);
      await sendEmail({ to: user.email, ...mail });
    },
  },
  // The database is far away (us-east-2); read the session from a signed cookie for 5 minutes
  // instead of querying it on every page.
  session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
  plugins: [nextCookies()],
});
