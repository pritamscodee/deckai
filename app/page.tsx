import Link from "next/link";
import { SlideView } from "@/components/slide-view";
import { Showcase } from "@/components/site/showcase";
import { PlanTiles } from "@/components/site/plan-tiles";
import { Reveal } from "@/components/site/reveal";
import { SAMPLE_DECK } from "@/lib/sample-deck";
import { FROM_PRICE } from "@/lib/plans";
import { COMPANY, LEGAL_PAGES } from "@/lib/legal";

// Notebook dividers: each tab opens a section and lends it its colour.
const folders = [
  { href: "#slides", label: "Slides", color: "var(--hl-blue)" },
  { href: "#how", label: "Two minutes", color: "var(--hl-mint)" },
  { href: "#inside", label: "What you get", color: "var(--hl-peach)" },
  { href: "#pricing", label: "Pricing", color: "var(--hl-pink)" },
  { href: "#questions", label: "Questions", color: "var(--hl-yellow)" },
];

// How long each stage really takes; widths follow the durations.
const stages = [
  { time: "Seconds", grow: 1, color: "var(--hl-yellow)", text: "First you type a topic, as a question or a sentence." },
  { time: "About ten seconds", grow: 2, color: "var(--hl-blue)", text: "Then Claude plans 6–10 slides that build on each other." },
  { time: "About two minutes", grow: 7, color: "var(--hl-mint)", text: "Next each slide is written and drawn, and shows up as soon as it's done." },
  { time: "As long as you like", grow: 3, color: "var(--hl-pink)", text: "Last you edit, present full screen, or export." },
];

const faqs = [
  ["Is there a free plan?", "No. Every plan is monthly and you can cancel any time; your plan keeps working until the end of the month you paid for. Prices include GST, so what you see is what you're charged."],
  ["What counts as a slide?", "Each slide Claude writes counts once, against your plan's monthly slides. Editing, presenting and exporting never count."],
  ["What happens when I reach my limit?", "The deck stops where it is and keeps every slide made so far. When your plan renews, or after you upgrade, continue it with one click."],
  ["Who draws the pictures?", "Claude. It picks doodles for each slide and draws illustrations as SVG, so every picture can be moved, resized and recolored in the editor."],
  ["Can I edit everything?", "Every word, in place, and you can rename the deck itself. Diagrams, doodles and illustrations open in a whiteboard where you can drag, recolor, add shapes and draw."],
  ["What can I export?", "PDF on every plan: your browser prints the slides exactly as you see them, pictures and all. Pro and Ultra also export PowerPoint with real, editable text boxes and shapes — handy if someone else needs to change the words. The .pptx leaves out the hand-drawn illustrations, which the PDF keeps."],
  ["Can I change plans later?", "Yes, from Plan & billing, and it moves the subscription you already have — never a second payment. Moving up starts now and Razorpay bills the difference for the month; moving down starts when the month you've paid for ends."],
  ["How do I pay?", "Through Razorpay, by card or UPI AutoPay, billed monthly in rupees."],
  ["Who can see my decks?", "Only you. Decks are private to your account."],
];

export default function Home() {
  const [title, bullets, cards] = SAMPLE_DECK.map((s) => s.slide);
  return (
    <div className="site">
      <Reveal />

      {/* Hero: the name, one sentence, and the notebook's dividers. */}
      <header className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[var(--ink)] text-[var(--ground)]">
        <nav className="wrap grid grid-cols-3 items-center pt-6 text-(length:--s-small)" aria-label="Main">
          <span />
          <Link href="/" className="justify-self-center font-[family-name:var(--head)] text-[24px] font-bold">DeckAI</Link>
          <Link href="/sign-in" className="text-link justify-self-end">Sign in</Link>
        </nav>
        <div className="wrap mt-[8vh] text-center">
          <h1 className="rise text-(length:--s-display)">DeckAI</h1>
          <p className="rise mx-auto mt-8 max-w-[46ch] text-[20px] text-[var(--ground)]" style={{ ["--i" as string]: 1 }}>
            Type a topic and get a hand-drawn slide deck in about two minutes, with every word, doodle and shape still yours to edit.
          </p>
        </div>

        <div className="relative mt-auto h-[50svh] min-h-[380px]">
          {folders.map((f, i) => (
            <div key={f.href} className="absolute inset-x-[7%] bottom-0 rounded-t-[10px] max-md:inset-x-0"
              style={{ top: `${i * 52}px`, background: f.color, zIndex: i }}>
              <a href={f.href} className="absolute -top-10 flex h-10 items-center px-6 text-[18px] text-[var(--ink)] transition-transform hover:-translate-y-1 max-md:-top-8 max-md:h-8 max-md:text-[15px]"
                style={{ left: `${4 + i * 18}%`, background: f.color, clipPath: "polygon(10% 0, 90% 0, 100% 100%, 0 100%)" }}>
                {f.label}
              </a>
            </div>
          ))}
          {/* The front folder is open: the action, and the first slide of a real deck. */}
          <div className="absolute inset-x-[7%] bottom-0 grid gap-8 p-8 text-[var(--ink)] max-md:inset-x-0 md:grid-cols-[1fr_1.4fr]"
            style={{ top: `${(folders.length - 1) * 52 + 1}px`, zIndex: folders.length }}>
            <div className="flex flex-col items-start gap-4">
              <Link href="/dashboard" className="hl-btn">Start a deck</Link>
              <p className="text-(length:--s-small)">From ₹{FROM_PRICE} a month. Cancel any time.</p>
            </div>
            <div data-ui className="max-md:hidden">
              <SlideView figure slide={title} theme="notebook" className="rounded-md" />
            </div>
          </div>
        </div>
      </header>

      <main>
        <section id="slides" aria-labelledby="slides-title" className="wrap py-[clamp(72px,10vw,160px)]">
          <Showcase />
        </section>

        <section id="how" aria-labelledby="how-title" className="wrap pb-[clamp(72px,10vw,160px)]">
          <h2 id="how-title" className="rise mb-16 text-(length:--s-h2)">Two minutes, start to finish</h2>
          <ol data-ui className="flex gap-1.5 max-md:h-[70svh] max-md:flex-col md:h-[22vh] md:min-h-[180px]">
            {stages.map((s, i) => (
              <li key={s.time} className="rise flex min-h-[72px] min-w-[12%] flex-col" style={{ flexGrow: s.grow, ["--i" as string]: i }}>
                <div className="flex-1 p-5 font-[family-name:var(--head)] text-[clamp(20px,2vw,30px)] font-bold" style={{ background: s.color }}>{s.time}</div>
                <p className="mt-3 max-w-[22ch] text-[17px] max-md:hidden">{s.text}</p>
              </li>
            ))}
          </ol>
          <ul className="mt-6 flex flex-col gap-2 text-[16px] md:hidden">{stages.map((s) => <li key={s.time}>{s.text}</li>)}</ul>
        </section>

        {/* The full-width band: the highlighter stroke at its largest, splitting the page. */}
        <div aria-hidden className="stroke mx-[-2vw] h-[clamp(40px,6vw,90px)] -rotate-1 bg-[var(--accent)]" />

        <section id="inside" aria-labelledby="inside-title" className="wrap py-[clamp(72px,10vw,160px)]">
          <h2 id="inside-title" className="rise mb-12 text-(length:--s-h2)">Notes you can redraw</h2>
          <div className="grid gap-12 md:grid-cols-12">
            <p className="rise text-(length:--s-statement) leading-[1.25] md:col-span-5" style={{ ["--i" as string]: 1 }}>
              Slides read like good study notes: key words highlighted, the idea doodled, notes ready to say.
            </p>
            <div className="grid gap-6 md:col-span-7">
              <div data-ui className="rise" style={{ ["--i" as string]: 2 }}><SlideView figure slide={bullets} theme="notebook" className="rounded-md" /></div>
              <div data-ui className="rise md:ml-[18%]" style={{ ["--i" as string]: 3 }}><SlideView figure slide={cards} theme="notebook" className="rounded-md" /></div>
            </div>
          </div>
          <ul className="mt-16 grid gap-x-12 gap-y-4 md:grid-cols-3">
            {["Click any word to rewrite it", "Drag, recolor and draw on every picture", "Two themes on Starter, three on Pro",
              "Present full screen with arrow keys", "Export a PDF on any plan", "Pictures drawn by Claude, not stock"].map((t, i) => (
              <li key={t} className="rise hl-bullet" style={{ ["--i" as string]: i }}>{t}</li>
            ))}
          </ul>
        </section>

        <section id="pricing" aria-labelledby="pricing-title" className="wrap pb-[clamp(72px,10vw,160px)]">
          <h2 id="pricing-title" className="rise mb-4 max-w-[12ch] text-(length:--s-h2)">Pick your pace</h2>
          <p className="rise mb-12 max-w-[56ch] text-[18px]">
            Prices include GST. Cancel any time and your plan runs to the end of the month you&apos;ve paid for;
            changing plan moves the subscription you already have, so you&apos;re never charged twice.
          </p>
          <PlanTiles />
        </section>

        <section id="questions" aria-labelledby="faq-title" className="wrap grid gap-10 pb-[clamp(72px,10vw,160px)] md:grid-cols-12">
          <h2 id="faq-title" className="rise text-[clamp(40px,4vw,64px)] md:sticky md:top-24 md:col-span-4 md:self-start">Questions</h2>
          <div className="flex flex-col gap-2 md:col-span-8">
            {faqs.map(([q, a]) => (
              <details key={q} name="faq" className="group rounded-[18px] bg-[var(--ground-2)] open:bg-[var(--hl-yellow)]">
                <summary className="flex min-h-[72px] cursor-pointer list-none items-center justify-between gap-6 px-6 text-[20px] [&::-webkit-details-marker]:hidden">
                  {q}
                  <span aria-hidden className="relative size-4 shrink-0">
                    <span className="absolute top-[6.5px] left-0 h-[3px] w-4 bg-[var(--ink)]" />
                    <span className="absolute top-[6.5px] left-0 h-[3px] w-4 rotate-90 bg-[var(--ink)] transition-transform group-open:rotate-0" />
                  </span>
                </summary>
                <p className="max-w-[52ch] px-6 pb-6 text-[18px]">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section aria-labelledby="cta-title" className="grid gap-3 overflow-hidden pb-[clamp(72px,10vw,160px)] md:grid-cols-12">
          <div aria-hidden className="rounded-r-[18px] bg-[var(--hl-yellow)] max-md:hidden md:col-span-2 md:h-[360px]" />
          <div className="grid items-center gap-8 rounded-[18px] bg-[var(--accent)] p-10 max-md:mx-[var(--margin)] md:col-span-8 md:h-[360px] md:grid-cols-2">
            <div className="flex flex-col items-start gap-4">
              <h2 id="cta-title" className="text-[clamp(32px,3vw,48px)]">Draw your next talk</h2>
              <p className="max-w-[30ch] text-[24px] leading-tight">Tell it the topic tonight; present it tomorrow.</p>
              <Link href="/dashboard" className="hl-btn quiet">Start a deck</Link>
            </div>
            <div data-ui className="max-md:hidden"><SlideView figure slide={SAMPLE_DECK[5].slide} theme="notebook" className="rounded-md" /></div>
          </div>
          <div aria-hidden className="rounded-l-[18px] bg-[var(--hl-mint)] max-md:hidden md:col-span-2 md:h-[360px]" />
        </section>
      </main>

      <footer className="wrap pb-10">
        {/* The name, built from highlighter blocks. */}
        <div aria-label="DeckAI" role="img" className="flex h-[clamp(140px,34svh,320px)] items-end gap-1">
          {["D", "e", "c", "k", "A", "I"].map((ch, i) => (
            <span key={i} aria-hidden className="flex flex-1 items-end justify-center rounded-t-[14px] pb-[0.05em] font-[family-name:var(--head)] text-[clamp(56px,13vw,220px)] leading-[0.8] font-bold"
              style={{ height: `${[100, 72, 84, 64, 92, 78][i]}%`, background: ["var(--hl-yellow)", "var(--hl-pink)", "var(--hl-blue)", "var(--hl-mint)", "var(--hl-peach)", "var(--accent)"][i] }}>
              {ch}
            </span>
          ))}
        </div>
        <div className="mt-14 flex flex-wrap items-center justify-between gap-6 text-(length:--s-small)">
          <nav className="flex flex-wrap gap-x-8 gap-y-2" aria-label="Footer">
            <a href="#slides" className="text-link">Slides</a>
            <a href="#pricing" className="text-link">Pricing</a>
            <a href="#questions" className="text-link">Questions</a>
            <Link href="/sign-in" className="text-link">Sign in</Link>
            {LEGAL_PAGES.map((p) => <Link key={p.href} href={p.href} className="text-link">{p.label}</Link>)}
          </nav>
          <span>© {COMPANY.year} {COMPANY.legalName}</span>
          <Link href="/dashboard" className="hl-btn">Start a deck</Link>
        </div>
      </footer>
    </div>
  );
}
