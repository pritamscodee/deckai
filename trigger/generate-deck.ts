import { task, metadata, logger, AbortTaskRunError } from "@trigger.dev/sdk";
import { generateImage, generateText, Output, APICallError, RetryError } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import type { z } from "zod";
import { IMAGED, Outline, SlideOutput, slideText, toSlide, type CardScene, type Theme } from "@/lib/slide-schema";
import { slideToSvg, uploadToImageKit } from "@/lib/slide-svg";
import { db } from "@/lib/db";
import { activePlan } from "@/lib/plans";
import { ILLUSTRATION_STYLE, OUTLINE_INSTRUCTION, SLIDE_INSTRUCTION } from "./prompt";

// Haiku is the lowest-cost Claude model.
const model = anthropic("claude-haiku-5-5");

// Illustrations come from OpenAI's image model. gpt-image-1-mini at "low" quality is the
// cheapest of them, which matters because a deck draws one of these per illustrated slide.
// The bytes go to ImageKit rather than into the slide as a data URI: the scene JSON is
// capped (see saveSlide) and a deck's worth of inline images would bloat every row.
async function drawIllustration(prompt: string, baseName: string, folder: string) {
  const { image, warnings } = await generateImage({
    model: openai.image("gpt-image-1-mini"),
    prompt: `${ILLUSTRATION_STYLE}

Draw this scene: ${prompt}`,
    size: "1024x1024",
    providerOptions: { openai: { quality: "low", background: "transparent", outputFormat: "webp" } },
  });
  // A dropped option (transparency, webp) still yields a usable picture, so it's a note not a failure.
  if (warnings.length) logger.warn("Illustration options not applied", { warnings });
  const ext = image.mediaType.split("/")[1] ?? "png";
  return uploadToImageKit(image.uint8Array, `${baseName}.${ext}`, folder, image.mediaType);
}

// Anthropic answers 400 "Your credit balance is too low" when the account has no credit left.
function isOutOfCredit(err: unknown): boolean {
  const e = RetryError.isInstance(err) ? err.lastError : err;
  return APICallError.isInstance(e) && /credit balance|billing/i.test(e.responseBody ?? e.message);
}

// Asking for distinct subjects is not enough: "stacked blocks" and "a tower of blocks" come
// back as different strings for the same picture. Compare the content words instead, so a
// repeat is caught by what it draws rather than by how it is worded.
const SUBJECT_STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "of", "in", "on", "to", "for", "with", "its", "their", "that",
  "this", "is", "are", "showing", "shows", "show", "illustration", "drawing", "sketch", "image",
  "simple", "clear", "hand", "drawn", "style", "one", "two", "three", "each", "into", "from",
]);

const subjectWords = (text: string) =>
  new Set(
    text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
      .filter(word => word.length > 2 && !SUBJECT_STOPWORDS.has(word)),
  );

// Two shared content words is a repeat in practice; with a very short subject, one is enough.
const sameSubject = (a: Set<string>, b: Set<string>) => {
  const shared = [...a].filter(word => b.has(word)).length;
  return shared >= 2 || (shared >= 1 && Math.min(a.size, b.size) <= 2);
};

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
    // Each slide is its own model call, so the model cannot see what earlier slides drew.
    // Without this list "do not repeat a previous illustration" is unfollowable, and a deck
    // ends up with the same subject drawn on several slides. Seeded on a retry from the
    // slides already saved, so continuing a deck doesn't start the comparison over.
    const drawnSoFar: string[] = [];
    const drawnSubjects: Set<string>[] = [];
    if (done.size) {
      const saved = await db.slide.findMany({
        where: { deckId }, orderBy: { order: "asc" }, select: { scene: true },
      });
      for (const row of saved) {
        const prompt = (row.scene as { slide?: { image?: { prompt?: string } } })?.slide?.image?.prompt;
        if (prompt) { drawnSoFar.push(prompt); drawnSubjects.push(subjectWords(prompt)); }
      }
    }

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
Layout: ${s.layout}
Planned visual: ${s.visual ?? "none"}${drawnSoFar.length ? `

Illustrations already used earlier in this deck. Choose a different subject and
composition; do not draw any of these again:
${drawnSoFar.map((d, n) => `${n + 1}. ${d}`).join("\n")}` : ""}`,
        });
        const card = toSlide(output);
        const { notes, imagePrompt } = output;
        if (imagePrompt) drawnSoFar.push(imagePrompt);
        // Drawn before saving so the slide isn't rewritten under someone editing it.
        // Last line of defence on repeats: the deck would rather have one picture than the
        // same picture twice, so a repeated subject is dropped instead of drawn again.
        const subject = imagePrompt ? subjectWords(imagePrompt) : null;
        const repeats = !!subject && drawnSubjects.some(seen => sameSubject(subject, seen));
        if (repeats) logger.warn("Illustration repeats an earlier subject, skipping", { slide: i, imagePrompt });
        // A card already fills the picture column, so an image here would be paid for and never seen.
        if (imagePrompt && !repeats && !card.card && IMAGED.includes(card.layout)) {
          try {
            const url = await drawIllustration(imagePrompt, `illustration-${i}`, `/decks/${deckId}`);
            if (url) { card.image = { url, prompt: imagePrompt }; drawnSubjects.push(subject!); }
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
