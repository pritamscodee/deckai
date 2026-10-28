import type { Metadata } from "next";
import { Clause, LegalPage } from "@/components/site/legal-page";
import { COMPANY, PROCESSORS } from "@/lib/legal";

export const metadata: Metadata = { title: "Privacy policy · DeckAI" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      intro={`What ${COMPANY.product} collects, who it passes to, and how to get rid of it. Short version: your decks are private, your prompts go to Claude so it can write them, and we don't sell anything to anyone.`}
    >
      <Clause heading="What we collect">
        <ul className="flex list-disc flex-col gap-2 pl-6">
          <li><strong>Your account:</strong> name, email address and a hashed password. We never store the password itself.</li>
          <li><strong>What you make:</strong> the topics you type, the decks and slides generated from them, your edits, and speaker notes.</li>
          <li><strong>Your plan:</strong> which plan you are on, your Razorpay subscription id and status, the renewal date, and how many decks and slides you have used this month. Card details go to Razorpay and never reach us.</li>
          <li><strong>Technical records:</strong> a session cookie that keeps you signed in, and server logs including IP address and the pages requested.</li>
        </ul>
        <p>There are no advertising or analytics trackers on the site.</p>
      </Clause>

      <Clause heading="Why we hold it">
        <p>
          To run your account, generate and store your decks, take the payment you have agreed to, keep the
          service working and secure, and answer you when you get in touch. We rely on performing our
          contract with you for the first three, and on our legitimate interest in a working, secure service
          for the rest.
        </p>
      </Clause>

      <Clause heading="Who it reaches">
        <p>
          Only the services needed to run {COMPANY.product}. Each gets the minimum it needs, and none of them
          may use your content for their own purposes.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[16px]">
            <thead>
              <tr className="text-left">
                <th className="border-b border-[var(--rule)] py-2 pr-4">Service</th>
                <th className="border-b border-[var(--rule)] py-2 pr-4">What it does</th>
                <th className="border-b border-[var(--rule)] py-2">What it sees</th>
              </tr>
            </thead>
            <tbody>
              {PROCESSORS.map((p) => (
                <tr key={p.name}>
                  <td className="border-b border-[var(--rule)] py-2 pr-4 align-top font-semibold">{p.name}</td>
                  <td className="border-b border-[var(--rule)] py-2 pr-4 align-top">{p.role}</td>
                  <td className="border-b border-[var(--rule)] py-2 align-top">{p.data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Some of these are outside India, so your data is transferred abroad to be processed. We don&apos;t
          sell personal data, and we don&apos;t share it for advertising.
        </p>
      </Clause>

      <Clause heading="Your prompts and Claude">
        <p>
          To write a deck, the topic you type is sent to Anthropic&apos;s API along with the instructions that
          shape a slide. Anthropic processes it to return the slide and does not use API content to train its
          models. Don&apos;t put anything confidential, personal or sensitive about other people into a prompt
          or a slide.
        </p>
      </Clause>

      <Clause heading="How long we keep it">
        <p>
          Decks and slides stay until you delete them or close your account. Deleting a deck removes it and
          its slides from the database immediately; thumbnails already uploaded may sit in the image cache for
          up to 30 days. Account and billing records are kept while your account is open, and payment records
          for as long as tax law requires. Server logs are kept for 30 days.
        </p>
      </Clause>

      <Clause heading="What you can ask for">
        <p>
          A copy of what we hold on you, a correction, or deletion of your account and everything in it. Email{" "}
          <a href={`mailto:${COMPANY.supportEmail}`} className="text-link">{COMPANY.supportEmail}</a> from the
          address on your account and we will act within 30 days. Deleting your account cancels your plan and
          cannot be undone.
        </p>
      </Clause>

      <Clause heading="Cookies">
        <p>
          One cookie, which holds your signed-in session and lasts until you sign out. It is strictly necessary
          for the site to work, so there is no cookie banner to click through. Razorpay sets its own cookies
          inside its checkout window; those are covered by Razorpay&apos;s privacy policy.
        </p>
      </Clause>

      <Clause heading="Security, and telling you when something goes wrong">
        <p>
          Passwords are hashed, traffic is encrypted in transit, and decks are readable only by the account
          that owns them. No service is perfectly secure; if a breach affects your data we will email you and
          tell the relevant authority as the law requires.
        </p>
      </Clause>

      <Clause heading="Children">
        <p>
          {COMPANY.product} is not for children under 13, and we do not knowingly hold their data. If you
          believe a child has made an account, email us and we will remove it.
        </p>
      </Clause>
    </LegalPage>
  );
}
