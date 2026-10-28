"use client";
import { useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { confirmSubscription, startSubscription, switchPlan } from "@/app/actions";
import { PLANS, type PlanId } from "@/lib/plans";

type RazorpayResponse = { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string };
declare global {
  interface Window { Razorpay?: new (options: Record<string, unknown>) => { open(): void } }
}

// Stepped like a bar chart: the bigger plan is the taller tile.
const look: Record<PlanId, { bg: string; strip: string; h: string }> = {
  starter: { bg: "var(--hl-blue)", strip: "#a5d8ff", h: "md:h-[380px]" },
  pro: { bg: "var(--hl-yellow)", strip: "#ffd43b", h: "md:h-[480px]" },
  ultra: { bg: "var(--hl-pink)", strip: "#f783ac", h: "md:h-[580px]" },
};

export function PlanTiles({ current }: { current?: PlanId | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  // On a plan already: move the existing subscription instead of creating a second one.
  async function change(plan: PlanId) {
    setBusy(plan);
    setMessage(null);
    setNote(null);
    const res = await switchPlan(plan);
    setBusy(null);
    if ("error" in res) return setMessage(res.error ?? null);
    setNote(res.message ?? null);
    router.refresh();
  }

  async function choose(plan: PlanId) {
    if (current) return change(plan);
    setBusy(plan);
    setMessage(null);
    setNote(null);
    const res = await startSubscription(plan);
    if ("error" in res) { setBusy(null); return setMessage(res.error ?? null); }
    if (!window.Razorpay) { setBusy(null); return setMessage("Checkout didn't load. Check your connection and try again."); }
    new window.Razorpay({
      key: res.keyId,
      subscription_id: res.subscriptionId,
      name: "DeckAI",
      description: `${PLANS[plan].name} plan, monthly`,
      prefill: { email: res.email, name: res.name },
      theme: { color: "#e8590c" },
      handler: async (r: RazorpayResponse) => {
        const ok = await confirmSubscription(r.razorpay_payment_id, r.razorpay_subscription_id, r.razorpay_signature);
        if ("error" in ok) return setMessage(ok.error ?? null);
        router.push("/dashboard?welcome=1");
      },
      modal: { ondismiss: () => setBusy(null) },
    }).open();
  }

  const label = (p: PlanId) => {
    if (current === p) return "Your plan";
    if (busy === p) return current ? "Changing…" : "Opening checkout…";
    if (!current) return `Choose ${PLANS[p].name}`;
    return PLANS[p].price > PLANS[current].price ? `Upgrade to ${PLANS[p].name}` : `Move to ${PLANS[p].name}`;
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="grid gap-2 md:grid-cols-3 md:items-end">
        {Object.values(PLANS).map((p, i) => (
          <div key={p.id} className={`rise flex flex-col overflow-hidden rounded-[18px] ${look[p.id].h}`} style={{ background: look[p.id].bg, ["--i" as string]: i }}>
            <div className="flex flex-1 flex-col gap-1 p-7">
              <h3 className="mb-2 text-[28px]">{p.name}</h3>
              <p className="font-[family-name:var(--head)] text-[56px] leading-none font-bold">₹{p.price}<span className="text-[20px]">/mo</span></p>
              <p className="text-[15px]">Inclusive of GST</p>
              <ul className="mt-4 flex flex-col gap-1.5">
                {p.features.map((f) => <li key={f} className="hl-bullet">{f}</li>)}
              </ul>
            </div>
            <button type="button" onClick={() => choose(p.id)} disabled={!!busy || current === p.id}
              className="flex h-16 items-center px-7 text-left font-[family-name:var(--head)] text-[22px] font-bold transition-[filter] hover:brightness-95 focus-visible:outline-3 focus-visible:outline-offset-[-6px] focus-visible:outline-[var(--ink)] disabled:cursor-default"
              style={{ background: look[p.id].strip }}>
              {label(p.id)}
            </button>
          </div>
        ))}
      </div>
      {note && <p role="status" className="mt-4 rounded-xl bg-[var(--hl-mint)] px-4 py-3">{note}</p>}
      {message && <p role="alert" className="mt-4 text-[var(--accent)]">{message}</p>}
    </>
  );
}
