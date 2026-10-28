import { Suspense } from "react";
import { format } from "date-fns";
import { getCurrentUser } from "@/lib/session";
import { activePlan, type PlanId } from "@/lib/plans";
import { cancelSubscription } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { PlanTiles } from "@/components/site/plan-tiles";

export default function PricingPage() {
  return (
    <Suspense fallback={<p className="p-8">Loading…</p>}>
      <AppShell active="billing">
        <Suspense fallback={<p className="p-8">Loading your plan…</p>}>
          <Billing />
        </Suspense>
      </AppShell>
    </Suspense>
  );
}

async function Billing() {
  const user = await getCurrentUser();
  const plan = activePlan(user);
  const cancelled = user.subscriptionStatus === "cancelled";

  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-col gap-12 px-4 py-8 md:py-[72px]">
      <section aria-labelledby="plan-title" className="flex flex-col gap-4">
        <h1 id="plan-title" className="text-[clamp(32px,4vw,48px)] leading-tight">Plan &amp; billing</h1>
        {plan ? (
          <div className="grid gap-6 rounded-2xl bg-[var(--tint-50)] p-6 md:grid-cols-[1fr_1fr_auto] md:items-center">
            <div>
              <p className="font-[family-name:var(--head)] text-[28px] font-bold">{plan.name} · ₹{plan.price}/mo</p>
              <p className="text-[var(--ink-soft)]">
                {cancelled ? "Cancelled. Works until " : "Renews "}{user.periodEnd ? format(user.periodEnd, "d MMMM yyyy") : "—"}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Usage label="Decks made" used={user.decksUsed} of={plan.decks} />
              <Usage label="Slides made" used={user.slidesUsed} of={plan.slides} />
              <p className="text-[14px] text-[var(--ink-soft)]">
                Counted when a deck is generated, so deleting one doesn&apos;t give the month&apos;s allowance back.
                Resets on {user.periodEnd ? format(user.periodEnd, "d MMMM") : "renewal"}.
              </p>
            </div>
            {!cancelled && (
              <form action={cancelSubscription}>
                <button type="submit" className="focusable underline decoration-2 underline-offset-4 hover:text-[var(--accent)]">Cancel plan</button>
                <p className="mt-1 max-w-[22ch] text-[14px] text-[var(--ink-soft)]">Runs to the end of the month you&apos;ve paid for. To change plan, pick another below instead.</p>
              </form>
            )}
          </div>
        ) : (
          <p className="max-w-[60ch] text-[20px]">Every deck is made on a monthly plan. Pick one below; you pay through Razorpay by card or UPI AutoPay and can cancel any time.</p>
        )}
      </section>

      <section aria-labelledby="plans-title" className="flex flex-col gap-6">
        <h2 id="plans-title" className="text-[28px]">{plan ? "Change plan" : "Plans"}</h2>
        {plan && !cancelled && (
          <p className="-mt-3 max-w-[70ch] text-[var(--ink-soft)]">
            Changing plan moves the subscription you already have — there&apos;s no second payment and no need to cancel.
            An upgrade starts now and Razorpay bills the difference for this month; a smaller plan starts when this month ends.
          </p>
        )}
        {cancelled && (
          <p className="-mt-3 max-w-[70ch] text-[var(--ink-soft)]">
            Your plan is cancelled and keeps working until {user.periodEnd ? format(user.periodEnd, "d MMMM yyyy") : "the end of the period"}.
            You can start a new plan after that, so you&apos;re never paying for two at once.
          </p>
        )}
        <PlanTiles current={plan && !cancelled ? (plan.id as PlanId) : null} />
      </section>
    </main>
  );
}

function Usage({ label, used, of }: { label: string; used: number; of: number }) {
  return (
    <div>
      <div className="flex justify-between text-[15px]"><span>{label}</span><span className="tabular-nums">{used} of {of}</span></div>
      <div className="track mt-1"><span style={{ width: `${Math.min(100, (used / of) * 100)}%` }} /></div>
    </div>
  );
}
