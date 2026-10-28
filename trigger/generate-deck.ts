import { task, metadata, logger, AbortTaskRunError } from "@trigger.dev/sdk";
import { generateText, Output, APICallError, RetryError } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import type { z } from "zod";
import { IMAGED, Outline, SlideOutput, slideText, toSlide, type CardScene, type Theme } from "@/lib/slide-schema";
import { slideToSvg, uploadToImageKit } from "@/lib/slide-svg";
import { db } from "@/lib/db";
import { activePlan } from "@/lib/plans";
import { IMAGE_INSTRUCTION, OUTLINE_INSTRUCTION, SLIDE_INSTRUCTION } from "./prompt";

// Haiku is the lowest-cost Claude model.
const model = anthropic("claude-haiku-5-5");

// Anthropic has no image model, so Claude draws the slide's illustration as SVG.
// Stored as a data URL: small, and shown through <img> so any markup in it can't run.
async function drawIllustration(prompt: string) {
  const { text } = await generateText({ model, system: IMAGE_INSTRUCTION, prompt });
  let svg = text.match(/<svg[\s\S]*<\/svg>/)?.[0];
  if (!svg) return null;
  // <img> only renders SVG that declares its namespace.
  if (!svg.includes("xmlns=")) svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

// Anthropic answers 400 "Your credit balance is too low" when the account has no credit left.
function isOutOfCredit(err: unknown): boolean {
  const e = RetryError.isInstance(err) ? err.lastError : err;
  return APICallError.isInstance(e) && /credit balance|billing/i.test(e.responseBody ?? e.message);
}

export const generateDeck = task({
  id: "generate-deck",
  maxDuration: 600,
  // The run only waits on Claude's API, so the smallest machine is enough (about half the default's cost).
  machine: "micro",
  run: async ({ deckId, prompt }: { deckId: string; prompt: string }) => {
    const deck = await db.deck.update({
      where: { id: deckId }, data: { status: "GENERATING", error: null },
      include: { slides: { select: { order: true } } },
    });
    // Slides already saved by an earlier attempt are kept, not paid for twice.
    const done = new Set(deck.slides.map(s => s.order));

    try {
      let outline = deck.outline as z.infer<typeof Outline> | null;
      if (!outline) {
        ({ output: outline } = await generateText({
          model,
          system: OUTLINE_INSTRUCTION,
          output: Output.object({ schema: Outline }),
          prompt: `Topic: ${prompt}`,
        }));
        await db.deck.update({ where: { id: deckId }, data: { outline, title: outline.deckTitle } });
      }
      metadata.set("total", outline.slides.length);

      for (const [i, s] of outline.slides.entries()) {
        if (done.has(i)) continue;
        // The plan's monthly slide allowance; checked per slide since a deck can be continued later.
        const owner = await db.user.findUniqueOrThrow({ where: { id: deck.ownerId } });
        const plan = activePlan(owner);
        if (!plan || owner.slidesUsed >= plan.slides) {
          await db.deck.update({ where: { id: deckId }, data: { status: "FAILED", error: plan
            ? `You've used this month's ${plan.slides} slides. Upgrade or wait for your plan to renew.`
            : "Your plan has ended. Choose a plan to keep generating." } });
          return;
        }
        const { output } = await generateText({
          model,
          system: SLIDE_INSTRUCTION,
          output: Output.object({ schema: SlideOutput }),
          prompt: `Deck: ${outline.deckTitle}
Slide ${i + 1} of ${outline.slides.length}
Title: ${s.title}
Key idea: ${s.keyIdea}
Layout: ${s.layout}`,
        });
        const card = toSlide(output);
        const { notes, imagePrompt } = output;
        // Drawn before saving so the slide isn't rewritten under someone editing it.
        if (imagePrompt && IMAGED.includes(card.layout)) {
          try {
            const url = await drawIllustration(imagePrompt);
            if (url) card.image = { url, prompt: imagePrompt };
          } catch (err) {
            if (isOutOfCredit(err)) throw err;
            logger.warn("Illustration failed", { slide: i, err: String(err) });  // the slide is fine without it
          }
        }
        // Saved immediately so the user sees it while the rest are generated.
        const slide = await db.slide.create({
          data: {
            deckId, order: i, title: card.title, notes,
            scene: { v: 2, slide: card } satisfies CardScene,
            searchText: [card.title, ...slideText(card), notes].join(" "),
          },
        });
        await db.user.update({ where: { id: deck.ownerId }, data: { slidesUsed: { increment: 1 } } });
        // A failed thumbnail shouldn't lose the slide.
        try {
          const svg = slideToSvg(card, deck.theme as Theme);
          const thumbnailUrl = await uploadToImageKit(svg, `${slide.id}.svg`, `/decks/${deckId}`);
          await db.slide.update({ where: { id: slide.id }, data: { thumbnailUrl } });
        } catch (err) {
          logger.warn("Thumbnail upload failed", { slideId: slide.id, err: String(err) });
        }
        metadata.set("done", i + 1);
      }

      await db.deck.update({ where: { id: deckId }, data: { status: "READY" } });
    } catch (err) {
      const outOfCredit = isOutOfCredit(err);
      await db.deck.update({
        where: { id: deckId },
        data: { status: "FAILED", error: outOfCredit ? "Ran out of Anthropic API credit." : "Something went wrong while generating." },
      });
      // Retrying can't help without credit.
      if (outOfCredit) throw new AbortTaskRunError("Anthropic credit exhausted");
      throw err;
    }
  },
  // Runs once, after the last retry has failed — the right place to refund, since the
  // catch above is re-entered on every attempt.
  onFailure: async ({ payload }) => {
    const deck = await db.deck.update({
      where: { id: payload.deckId },
      data: { status: "FAILED" },
      include: { _count: { select: { slides: true } } },
    });
    // Not one slide was made, so the deck shouldn't count against the month's allowance.
    // createDeck/retryDeck count it again only if the user starts it over.
    if (deck._count.slides === 0) {
      await db.user.updateMany({ where: { id: deck.ownerId, decksUsed: { gt: 0 } }, data: { decksUsed: { decrement: 1 } } });
    }
  },
});
