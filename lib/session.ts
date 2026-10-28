import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Cached per request: the shell and the page both ask, but the work happens once.
export const requireUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  return session.user;
});

// The full user row (plan and usage), fetched once per request.
export const getCurrentUser = cache(async () => {
  const { id } = await requireUser();
  return db.user.findUniqueOrThrow({ where: { id } });
});
