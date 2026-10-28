import type { Metadata } from "next";
import Link from "next/link";
import { Clause, LegalPage } from "@/components/site/legal-page";
import { COMPANY } from "@/lib/legal";
import { PLANS } from "@/lib/plans";

export const metadata: Metadata = { title: "Terms of service · DeckAI" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      intro={`These terms cover your use of ${COMPANY.product}, a service that turns a topic you type into an editable slide deck. By making an account you agree to them.`}
    >
      <Clause heading="What the service does">
        <p>
          You type a topic. Claude plans a deck of roughly 6–10 slides, writes each one and draws its
          pictures. You can then edit any text, redraw any picture, present the deck full screen, and
          export it. Decks are private to your account.
        </p>
      </Clause>

      <Clause heading="Your account">
        <p>
          You need an email address and a password of at least eight characters. Keep your password to
          yourself — anything done through your account is treated as done by you. Tell us at{" "}
          <a href={`mailto:${COMPANY.supportEmail}`} className="text-link">{COMPANY.supportEmail}</a> if you
          think someone else has access. One person per account; don&apos;t share logins.
        </p>
      </Clause>

      <Clause heading="Plans, allowances and payment">
        <p>
          Making decks requires a monthly plan. Prices are in Indian rupees and include GST:{" "}
          {Object.values(PLANS).map((p, i) => (
            <span key={p.id}>{i > 0 ? ", " : ""}{p.name} ₹{p.price} for {p.decks} decks and {p.slides} slides a month</span>
          ))}
          . Payment is taken by Razorpay, by card or UPI AutoPay, and renews each month until you cancel.
        </p>
        <p>
          A slide counts once, when Claude writes it. Editing, presenting and exporting never count. A deck
          that fails before any slide is made is not counted against your allowance. Allowances reset when a
          payment for a new month succeeds; unused decks and slides do not carry over.
        </p>
        <p>
          You can change plan at any time from <Link href="/pricing" className="text-link">Plan &amp; billing</Link>.
          Moving up takes effect immediately and Razorpay bills the difference for the current month; moving
          down takes effect when the month you have paid for ends. See{" "}
          <Link href="/refunds" className="text-link">cancellations and refunds</Link>.
        </p>
      </Clause>

      <Clause heading="What you may not do">
        <p>
          Don&apos;t use {COMPANY.product} to make material that is unlawful, that harasses or defames
          someone, that infringes another person&apos;s copyright or trade marks, that impersonates a real
          person or organisation, or that is sexual material involving children. Don&apos;t try to break,
          overload or get around the limits of the service, resell access to it, or use it to train a
          competing model.
        </p>
        <p>We may suspend an account that does these things, and will tell you why.</p>
      </Clause>

      <Clause heading="Who owns what">
        <p>
          Your prompts and your decks are yours. You keep every right in them, and you may use the decks you
          export for anything, including commercially. We store them so you can come back to them, and we do
          not publish them or use them to advertise the service.
        </p>
        <p>
          The service itself — the site, the editor, the themes and the code — stays ours.
        </p>
      </Clause>

      <Clause heading="Generated content comes with no guarantee of accuracy">
        <p>
          Slides are written by a language model. It can be confidently wrong: numbers, dates, quotations and
          technical claims may be inaccurate or invented. Check anything that matters before you present it.
          You are responsible for what you show to other people.
        </p>
        <p>
          Two people giving the same topic can get different decks, and a deck is not guaranteed to be
          original or free of resemblance to other material.
        </p>
      </Clause>

      <Clause heading="Availability">
        <p>
          We aim to keep the service running but do not promise it will be uninterrupted. Generation depends
          on outside services — Anthropic&apos;s API among them — and can slow down or stop if they do. We may
          change or remove features; if a change materially reduces what your plan includes, you may cancel
          and we will refund the unused part of the month.
        </p>
      </Clause>

      <Clause heading="Limits on liability">
        <p>
          To the extent the law allows, {COMPANY.legalName} is not liable for indirect or consequential loss,
          including lost profit, lost data or the consequences of relying on a generated slide. Our total
          liability for any claim is capped at what you paid us in the three months before it arose. Nothing
          here limits liability that cannot be limited by law.
        </p>
      </Clause>

      <Clause heading="Ending the agreement">
        <p>
          You can cancel your plan at any time, and delete your decks whenever you like. You can ask us to
          delete your account entirely by emailing{" "}
          <a href={`mailto:${COMPANY.supportEmail}`} className="text-link">{COMPANY.supportEmail}</a>. We may
          close an account that breaks these terms or that has not paid.
        </p>
      </Clause>

      <Clause heading="Changes and governing law">
        <p>
          If we change these terms we will update the date at the top and, for changes that affect what you
          pay or what you get, email you before they take effect. These terms are governed by the laws of{" "}
          {COMPANY.jurisdiction}, and its courts have jurisdiction.
        </p>
      </Clause>
    </LegalPage>
  );
}
