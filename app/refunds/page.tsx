import type { Metadata } from "next";
import Link from "next/link";
import { Clause, LegalPage } from "@/components/site/legal-page";
import { COMPANY } from "@/lib/legal";

export const metadata: Metadata = { title: "Cancellations and refunds · DeckAI" };

export default function RefundsPage() {
  return (
    <LegalPage
      title="Cancellations and refunds"
      intro={`Every ${COMPANY.product} plan is monthly and you can cancel it yourself at any time. This page says exactly what happens to your money and your decks when you do.`}
    >
      <Clause heading="Cancelling">
        <p>
          Go to <Link href="/pricing" className="text-link">Plan &amp; billing</Link> and choose Cancel plan.
          It takes effect at once — no email, no waiting for us. Your plan then keeps working until the end of
          the month you have already paid for, and is not charged again. You keep every deck you have made;
          they stay in your account whether or not you have a plan.
        </p>
        <p>
          To move to a different plan, pick it on that same page instead of cancelling. Changing plan moves the
          subscription you already have, so you are never charged twice.
        </p>
      </Clause>

      <Clause heading="Refunds">
        <p>
          Because a plan runs to the end of the month you have paid for, cancelling part-way through does not
          produce a refund — you simply keep using it until the period ends. We do refund in these cases:
        </p>
        <ul className="flex list-disc flex-col gap-2 pl-6">
          <li><strong>Charged after cancelling.</strong> Refunded in full.</li>
          <li><strong>Charged twice for the same month.</strong> The duplicate is refunded in full.</li>
          <li><strong>You paid and could not make any decks</strong> because the service was broken or unavailable, and we could not fix it for you. Refunded in full for that month.</li>
          <li><strong>We materially reduced what your plan includes</strong> mid-month. Refunded for the unused part of the month.</li>
          <li><strong>You subscribed by mistake</strong> and have generated no slides on the plan. Tell us within 7 days of the charge and we will refund it in full.</li>
        </ul>
        <p>
          Decks that failed part-way are not a reason for a refund on their own, because the slides already
          made stay yours and the deck can be continued with one click — and a deck that produced nothing at
          all is never counted against your allowance.
        </p>
      </Clause>

      <Clause heading="How to ask">
        <p>
          Email <a href={`mailto:${COMPANY.supportEmail}`} className="text-link">{COMPANY.supportEmail}</a> from
          the address on your account, with the date and amount of the charge. We reply within three working
          days. Approved refunds go back to the card or account that paid, through Razorpay, and usually arrive
          within 5–10 working days depending on your bank.
        </p>
      </Clause>

      <Clause heading="Failed payments">
        <p>
          If a monthly payment fails, Razorpay retries it. While it is being retried your plan keeps working
          until the end of the period you paid for. If every retry fails, the plan stops and deck generation
          stops with it — your existing decks remain, and you can start a new plan whenever you like.
        </p>
      </Clause>

      <Clause heading="Prices and tax">
        <p>
          Plan prices are shown in Indian rupees and include GST, so the amount on the pricing page is the
          amount you are charged. Razorpay&apos;s receipt is your invoice.
        </p>
      </Clause>
    </LegalPage>
  );
}
