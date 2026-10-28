import Link from "next/link";
import { COMPANY, LEGAL_PAGES } from "@/lib/legal";
import { Mark } from "@/components/app-shell";

// One shell for /terms, /privacy and /refunds: plain prose, easy to read, easy to cite.
export function LegalPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="site">
      <header className="wrap flex items-center justify-between gap-4 py-6">
        <Link href="/" className="focusable flex items-center gap-2 font-[family-name:var(--head)] text-[24px] font-bold">
          <Mark /> {COMPANY.product}
        </Link>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2 text-(length:--s-small)">
          {LEGAL_PAGES.map((p) => <Link key={p.href} href={p.href} className="text-link">{p.label}</Link>)}
        </nav>
      </header>
      <main className="wrap flex max-w-[76ch] flex-col gap-6 pb-24 legal">
        <h1 className="text-[clamp(34px,4vw,52px)] leading-tight">{title}</h1>
        <p className="text-[20px]">{intro}</p>
        <p className="text-(length:--s-small) text-[var(--ink-soft)]">Last updated {COMPANY.updated}.</p>
        {children}
        <section className="mt-6 flex flex-col gap-2 rounded-2xl bg-[var(--ground-2)] p-6">
          <h2 className="text-[22px]">Contact</h2>
          <p>
            {COMPANY.legalName}
            {COMPANY.address ? <>, {COMPANY.address}</> : null}
            {COMPANY.gstNumber ? <> · GSTIN {COMPANY.gstNumber}</> : null}
          </p>
          <p>
            Questions about this page, your account or a payment:{" "}
            <a href={`mailto:${COMPANY.supportEmail}`} className="text-link">{COMPANY.supportEmail}</a>.
            We reply within three working days.
          </p>
        </section>
      </main>
    </div>
  );
}

export function Clause({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="mt-4 text-[26px]">{heading}</h2>
      {children}
    </section>
  );
}
