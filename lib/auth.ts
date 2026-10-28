import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { resetPasswordEmail, sendEmail } from "@/lib/email";

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
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
