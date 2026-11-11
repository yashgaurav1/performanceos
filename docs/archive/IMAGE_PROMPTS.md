# PerformanceOS — Image Generation Guide

Generate every image below, save it with the **exact filename**, and put it in the **exact folder** inside your project's `public/` folder. Antigravity finds images by filename, so names must match letter for letter.

```
public/
├── images/
│   ├── photos/        ← Group A (photoreal food)
│   ├── illus/         ← Group B (illustrations)
│   ├── icons/food/    ← Group C (food icons)
│   ├── screens/       ← Group D (real app screenshots, you capture these)
│   └── founder.jpg    ← Group E (real photo of you)
└── video/             ← Group F (hero recording)
```

## Rules for generating (read once)

1. Use **one image model for everything** (pick the best one you have access to). Switching models mid-set breaks consistency.
2. Each group has a **STYLE BLOCK**. Paste it at the end of every prompt in that group, word for word. Never edit it.
3. Generate 3–4 variations per image and pick the best. **Reject any image with:** text or letters, logos, watermarks, faces or eyes on food, extra fingers, warped plates, melted-looking food, or wrong aspect ratio.
4. Download at the highest resolution offered. Save as `.png` (illustrations, icons) or `.jpg` (photos). Antigravity will compress them; don't compress yourself.
5. If your generator has an aspect-ratio setting, use it. If not, add the ratio to the prompt (e.g. "16:9 aspect ratio").

---

## Group A — Photoreal food (folder: `public/images/photos/`)

These are used where the product has to feel real. If you can, **shoot A2–A4 yourself with your phone** (top-down, daylight, dark cloth underneath). Real always beats generated. Use these prompts as the fallback or for the rest.

### STYLE BLOCK A (paste at the end of every Group A prompt)
> Photorealistic food photograph, shot with a full-frame camera and 50mm lens, soft natural window light from the top-left, gentle natural shadows, dark matte charcoal stone surface, realistic home-cooked Indian food with natural imperfections, appetizing but not glossy or over-styled, muted warm colour grade, shallow realistic depth, high detail. No text, no logos, no watermark, no people unless described, no cutlery clutter.

| File | Size / ratio | Used for |
|---|---|---|
| `hero-thali.jpg` | 2400×1350, 16:9 | Blurred hero background behind the phone |
| `meal-paneer.jpg` | 1600×1600, 1:1 | Scan demo tab 1 |
| `meal-biryani.jpg` | 1600×1600, 1:1 | Scan demo tab 2 |
| `meal-oats.jpg` | 1600×1600, 1:1 | Scan demo tab 3 |
| `meal-dal-rice.jpg` | 1600×1600, 1:1 | Guides / food pages |
| `meal-dosa.jpg` | 1600×1600, 1:1 | Guides / food pages |
| `meal-poha.jpg` | 1600×1600, 1:1 | Guides / food pages |
| `cta-phone-plate.jpg` | 2000×2500, 4:5 | Final call-to-action section |
| `lifestyle-desk.jpg` | 2000×1500, 4:3 | Bento grid / focus & money context |

**A1 — `hero-thali.jpg`**
> Wide overhead view (shot straight down) of a home-style Indian lunch spread on a dark charcoal surface: a steel thali with dal tadka in a steel katori, jeera rice, two phulkas with brown roasted spots, paneer sabzi, cucumber-onion salad with lemon wedge, a small bowl of curd. Arranged loosely toward the left and bottom edges, leaving calm empty dark space in the centre-right. 16:9 aspect ratio. [STYLE BLOCK A]

**A2 — `meal-paneer.jpg`**
> Straight top-down (90°) photo of a 26 cm stainless steel thali on a dark charcoal surface. On it: one steel katori (about 150 ml) of homestyle paneer bhurji with visible onion and green capsicum, two medium whole-wheat phulkas folded in half with light brown roasted spots and no ghee, and a small bowl of kachumber salad (diced cucumber, tomato, onion, coriander, lemon wedge). Each item clearly separated with space between them. Centered, square 1:1. [STYLE BLOCK A]

**A3 — `meal-biryani.jpg`**
> Straight top-down (90°) photo of a ceramic plate on a dark charcoal surface: one generous portion of Hyderabadi chicken biryani with long-grain basmati, visible chicken pieces and fried onions, two hard-boiled egg halves beside it showing the yolk, and a small steel katori of mint raita with a mint leaf. Items clearly separated. Centered, square 1:1. [STYLE BLOCK A]

**A4 — `meal-oats.jpg`**
> Straight top-down (90°) photo of a matte dark ceramic bowl on a dark charcoal surface: creamy rolled oats topped with neat banana slices and a sprinkle of crushed almonds, with a slightly visible swirl of protein (pale beige) mixed in. A small scoop of whey powder sits beside the bowl. Centered, square 1:1. [STYLE BLOCK A]

**A5 — `meal-dal-rice.jpg`**
> Straight top-down (90°) photo on a dark charcoal surface: a steel plate with a mound of steamed white rice, a steel katori of yellow dal tadka with cumin and a few curry leaves on top, and a small heap of dry aloo-gobi sabzi. Centered, square 1:1. [STYLE BLOCK A]

**A6 — `meal-dosa.jpg`**
> Straight top-down (90°) photo on a dark charcoal surface: a golden crisp masala dosa folded on a round steel plate, a small steel katori of sambar, and a small bowl of coconut chutney. Centered, square 1:1. [STYLE BLOCK A]

**A7 — `meal-poha.jpg`**
> Straight top-down (90°) photo on a dark charcoal surface: a ceramic bowl of yellow kanda poha with peanuts, curry leaves, chopped coriander and a lemon wedge on the side. Centered, square 1:1. [STYLE BLOCK A]

**A8 — `cta-phone-plate.jpg`**
> Photo from a 45° angle above: a person's hand holding a modern black smartphone horizontally above a steel thali of paneer bhurji, phulkas and salad, as if about to take a photo of the food. The phone is seen from the BACK (camera side visible, screen not visible). Only the hand and forearm are in frame, natural skin, normal five fingers. Dark charcoal surface, soft window light. Vertical 4:5 aspect ratio. [STYLE BLOCK A]

**A9 — `lifestyle-desk.jpg`**
> Calm top-down photo of a dark wooden desk at dusk: an open notebook with a pen, a closed laptop corner, a glass of water, a small steel bowl of roasted chana, and a phone lying face-down. Warm desk-lamp light from the top-left, lots of dark empty space. 4:3 aspect ratio. [STYLE BLOCK A]

---

## Group B — Illustrations (folder: `public/images/illus/`)

Used for section accents, empty states, the 404 page and social share images. All 1:1, **1024×1024**, `.png`.

### STYLE BLOCK B (paste at the end of every Group B prompt)
> Flat editorial illustration, simple geometric shapes, no outlines, no faces or eyes, no 3D, no clay, no glossy gradients, only one soft highlight per object, limited colour palette of coral #FF7A59, amber #F5B841, teal #3CC8C0 and off-white #F5F5F4 with deep grey #1C1C1F accents, on a solid flat background of exactly #0C0C0D filling the whole image, subtle fine grain texture, soft light from the top-left, centered composition with generous empty space around the subject, calm premium minimal style. No text, no letters, no numbers, no logos, no watermark. Square 1:1.

| File | Subject prompt (put STYLE BLOCK B after it) |
|---|---|
| `trend.png` | A simple bathroom weighing scale seen from slightly above, with a smooth gently descending curved line floating above it made of small coral dots that settle into one calm teal line. |
| `coach.png` | Two overlapping rounded speech bubbles, the front one off-white, the back one teal, with a small amber leaf resting on the front bubble. |
| `train.png` | A single dumbbell lying diagonally next to one round weight plate, coral and deep grey. |
| `focus.png` | A round analogue timer in teal next to an open notebook with a small amber bookmark ribbon. |
| `money.png` | A neat stack of three amber coins beside a small off-white wallet, one coin slightly tilted. |
| `goals.png` | Three rounded cards stacked vertically, slightly fanned, each with a simple tick mark shape in teal, coral and amber. |
| `privacy.png` | A rounded padlock in off-white with a teal shackle, resting inside a soft coral circular shield shape. |
| `offline.png` | A smartphone shape lying flat with a small amber cloud above it and two curved teal arrows forming a circle between them (sync). |
| `scan.png` | A steel thali seen from above with three simple food shapes on it (round roti in amber, katori in teal, salad in coral), with four thin off-white corner brackets framing the plate like a camera viewfinder. |
| `empty-meals.png` | An empty round steel thali seen from above with a single spoon resting on the edge. |
| `empty-workouts.png` | A dumbbell resting on a simple flat gym bench, viewed from the side. |
| `empty-focus.png` | An hourglass with most of the amber sand still at the top. |
| `404.png` | A small tipped-over steel katori with a gentle spill of amber dal forming a soft question-mark shape on the surface. |
| `og-base.png` | (1200×630, 1.91:1 — override the square rule) A wide composition with a steel thali on the right third holding simple roti, katori and salad shapes, a thin teal trend line rising and settling across the left, large calm empty space on the left half for a headline to be added later. |

---

## Group C — Food icon set (folder: `public/images/icons/food/`)

Small icons for food pages, the scan demo item list and bento accents. All **512×512**, `.png`. Generate them in one sitting with the same model.

### STYLE BLOCK C (paste at the end of every Group C prompt)
> Single food icon, flat editorial illustration, simple geometric shapes, no outlines, no faces, no 3D, limited palette of coral #FF7A59, amber #F5B841, teal #3CC8C0, off-white #F5F5F4 and deep grey #1C1C1F, on a solid flat background of exactly #0C0C0D, subtle fine grain, viewed from a consistent 3/4 top-down angle, subject centered and filling about 60% of the frame. No text, no logo, no watermark. Square 1:1.

| File | Subject |
|---|---|
| `roti.png` | One round phulka with a few brown roasted spots |
| `rice.png` | A small mound of white rice in a steel bowl |
| `dal.png` | A steel katori of yellow dal with a few cumin seeds |
| `paneer.png` | Four cubes of paneer stacked casually |
| `biryani.png` | A small bowl of biryani with a chicken piece on top |
| `idli.png` | Two idlis side by side |
| `dosa.png` | A folded golden dosa |
| `egg.png` | Two halves of a boiled egg |
| `chicken.png` | One grilled chicken breast piece |
| `banana.png` | One banana |
| `oats.png` | A bowl of oats with banana slices |
| `whey.png` | A scoop of protein powder |
| `salad.png` | A small bowl of chopped cucumber and tomato |
| `curd.png` | A small bowl of white curd |
| `chana.png` | A small heap of roasted chickpeas |
| `poha.png` | A small bowl of yellow poha with peanuts |

---

## Group D — Real app screenshots (folder: `public/images/screens/`) — capture, don't generate

First, make sure the demo account (Ayush) has 30 days of realistic data (ask Antigravity to seed it if it's thin). Numbers must match the landing page: burn 2,550 kcal, target 2,000 kcal, protein 180 g, goal −0.5 kg/week.

**How to capture (Chrome on your laptop):**
1. Open the live app and launch demo mode.
2. Press **F12** → click the phone/tablet icon (top-left of DevTools) → choose **iPhone 14 Pro**.
3. Set zoom to 100%. Navigate to the screen.
4. Press **Ctrl + Shift + P** → type `screenshot` → choose **Capture screenshot** (not "full size", unless noted).
5. Rename the file and save it to `public/images/screens/`.

| File | Screen | What must be visible |
|---|---|---|
| `today.png` | Today | Calorie ring part-filled, macros, today's meals, weight trend |
| `scan-result.png` | Eat → after scanning a meal | Detected items with grams and macros, the sliders |
| `trend.png` | Weight trend chart (30 days) | Dots for daily weigh-ins + smooth trend line |
| `coach.png` | Coach chat | A full question and a nicely formatted answer (markdown rendered) |
| `train.png` | Train | A logged workout with sets, reps and weekly volume |
| `focus.png` | Study / focus | Today's focus time and streak |
| `budget.png` | Money | Daily allowance and month progress |
| `goals.png` | Goals / Big Three | Three priorities, one ticked |

---

## Group E — Founder photo (file: `public/images/founder.jpg`)

A real photo of you. Natural light, simple background, looking at the camera or slightly away, shoulders up. At a desk or in a gym is ideal. Portrait 4:5, at least 1200×1500. Not a passport-style photo, not a heavy filter.

---

## Group F — Hero video (folder: `public/video/`)

Screen-record the real app on your phone (or in Chrome DevTools phone mode with a screen recorder) for **6–8 seconds**:
open Eat → tap Scan → photo of a plate appears → detected items slide in → macro rings fill → "Saved".

Save it as `hero-raw.mp4` in `public/video/`. Antigravity will compress it to `hero.mp4` and `hero.webm` and create `hero-poster.jpg`. If you can't record it, skip this; the hero will use `screens/scan-result.png` instead.

---

## Final checklist before handing to Antigravity

- [ ] 9 photos in `public/images/photos/`
- [ ] 14 illustrations in `public/images/illus/`
- [ ] 16 icons in `public/images/icons/food/`
- [ ] 8 screenshots in `public/images/screens/`
- [ ] `public/images/founder.jpg`
- [ ] `public/video/hero-raw.mp4` (optional)
- [ ] All filenames lowercase, exactly as listed
- [ ] No image contains text, logos, faces on food or warped hands
