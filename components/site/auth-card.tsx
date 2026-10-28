import Link from "next/link";
import { SlideView } from "@/components/slide-view";
import { SAMPLE_DECK } from "@/lib/sample-deck";

export const authField =
  "h-12 w-full rounded-[10px] border border-[var(--rule)] bg-white px-3 text-[18px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--tint-200)]";

// The split screen shared by sign-in, forgot-password and reset-password.
export function AuthCard({ title, blurb, children, slide = 1 }: { title: string; blurb: string; children: React.ReactNode; slide?: number }) {
  return (
    <div className="site app grid min-h-svh lg:grid-cols-[minmax(420px,5fr)_7fr]">
      <main className="flex flex-col px-[var(--margin)] py-8">
        <Link href="/" className="focusable font-[family-name:var(--head)] text-[24px] font-bold">DeckAI</Link>
        <div className="my-auto flex w-full max-w-[400px] flex-col gap-6 py-12">
          <div>
            <h1 className="text-[34px] leading-tight">{title}</h1>
            <p className="mt-2 text-[var(--ink-soft)]">{blurb}</p>
          </div>
          {children}
        </div>
      </main>
      <aside aria-label="A slide made with DeckAI" className="flex items-center justify-center bg-[var(--tint-50)] p-[6%] max-lg:hidden">
        <div data-ui className="w-full max-w-[860px] -rotate-1">
          <SlideView figure slide={SAMPLE_DECK[slide].slide} theme="notebook" className="rounded-lg" />
        </div>
      </aside>
    </div>
  );
}
