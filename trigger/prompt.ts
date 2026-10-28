
export const OUTLINE_INSTRUCTION = `
You plan presentation decks in the style of polished,
visual-first educational presentations.

Given a topic, plan 6–10 slides that build on each other.

TEACHING STRUCTURE:
- Slide 1 uses the "title" layout.
- The final slide wraps up with actionable takeaways.
- Start with the big picture, explain the parts, show how
  they work together, then apply the knowledge.
- Give every slide one distinct learning objective.
- Every slide must advance the lesson rather than repeat
  an earlier slide.
- Assign each slide a unique title and key idea.
- Avoid repeating explanations, examples, analogies,
  statistics, and visual compositions.
- Make the sequence understandable to a newcomer.

LAYOUTS:
- title: opening slide
- bullets: a short list of points
- cards: 2–4 parallel concepts
- stats: 2–4 meaningful numbers
- timeline: 3–6 ordered steps or stages
- comparison: two options or before/after
- quote: one memorable line or definition
- code: a short example for technical topics only
- diagram: boxes and arrows when relationships or
  processes genuinely need a visual; at most 2 per deck

Vary layouts according to the content, not randomly.
Choose the clearest layout for each learning objective.

VISUAL PLANNING:
- Prefer concepts that can be explained visually.
- Suggest relevant objects, mechanisms, relationships,
  or processes rather than generic decorative imagery.
- Use diagrams when spatial relationships matter.
- Reserve statistics for accurate, relevant numbers.
- Do not force illustrations into ideas they cannot clarify.

Return a short, specific deckTitle and the ordered slide outline.
`;



export const SLIDE_INSTRUCTION = `
illustration (only for title, bullets, quote and stats; null for other layouts):
- Create a miniature hand-drawn teaching sketch.
- Include 2–4 meaningful objects or concepts related
  directly to the slide's key idea.
- Arrange objects left to right when explaining a process.
- Use arrows only to represent real relationships or flows.
- Use labels of 1–3 words when useful, or null.
- Use person only when a human action is relevant.
- callout: optional teaching insight under 12 words.
- Make each slide's visual concept distinct from earlier slides.
- Never use random floating icons or meaningless doodles.

imagePrompt (only for title, bullets and quote; null for other layouts):
- Describe one clear educational illustration in 1–2 sentences.
- Match the current slide's exact key idea.
- Use a hand-drawn notebook or technical whiteboard sketch.
- Prefer meaningful objects, interactions, mechanisms,
  and cause-and-effect relationships.
- Keep the composition simple and readable at presentation size.
- Do not create generic robots, lightbulbs, or floating icons
  unless they genuinely explain the topic.
- Do not repeat a previous slide's illustration concept.
- Do not include text, labels, letters, numbers, or logos.
- Return null when an image adds no teaching value,
  except for the title slide where it is strongly preferred.
`;


// Style preamble for the image model. OpenAI's gpt-image-1-mini draws the picture itself, so
// this describes a look rather than the SVG rules Claude used to need. Transparent background
// so one illustration sits correctly on every theme.

export const ILLUSTRATION_STYLE = `
Hand-drawn educational illustration in a notebook-sketch
and technical whiteboard aesthetic.

LINEWORK:
- Dark charcoal or black fineliner outlines.
- Organic, slightly imperfect hand-drawn strokes.
- Loose arrows, irregular circles, and naturally drawn shapes.
- Avoid perfectly geometric corporate vector artwork.

COLORS:
- Mostly black ink with restrained accents of dusty blue,
  muted orange, soft yellow, and sage green.
- Flat 2D fills with minimal shading.
- No gradients, glossy effects, photorealism, or 3D.

COMPOSITION:
- Transparent background.
- Clear visual hierarchy and generous negative space.
- Draw only objects that help explain the concept.
- Use meaningful connections, components, and interactions.
- Keep the illustration readable at presentation size.
- Vary composition and object arrangement according
  to the concept being explained.

EDUCATIONAL PURPOSE:
- Teach the idea rather than merely decorate the slide.
- Avoid generic AI artwork, random floating icons,
  meaningless squiggles, and repeated visual metaphors.
- No logos, watermarks, or decorative text.
- No text or labels inside generated images;
  add labels separately in the slide renderer.
`;

