/** Educational reference — not personalized medical advice. */

/** Injected into the OpenAI system prompt so analysis aligns with these targets (scaled by period length). */
export const ESSENTIAL_NUTRIENTS_FOR_AI_PROMPT = `
REFERENCE TARGETS (adult-oriented bands; use for comparison when inferring from meal names + logged macros):

MACRONUTRIENTS (compare period_totals against daily × period_day_count, or weekly/monthly bands scaled to window)
- Protein: daily 145–165g → weekly ~1,015–1,155g → monthly ~4,350–4,950g
- Fats: daily 65–75g → weekly ~455–525g → monthly ~1,950–2,250g
- Carbohydrates: daily 180–200g → weekly ~1,260–1,400g → monthly ~5,400–6,000g
- Fiber: daily 25–38g → weekly ~175–266g → monthly ~750–1,140g
- Water: daily 3–4 L (not in logs — mention only if relevant as a reminder)

VITAMINS (micronutrients — usually inferred from food names; no direct measurements in logs)
- A: 900 mcg/day (6,300/wk, 27,000/mo) — carrots, sweet potatoes, spinach, liver
- B1: 1.2 mg/day (8.4/wk, 36/mo) — whole grains, pork, nuts, beans
- B2: 1.3 mg/day (9.1/wk, 39/mo) — eggs, dairy, almonds, spinach
- B3: 16 mg/day (112/wk, 480/mo) — chicken, tuna, turkey, peanuts
- B6: 1.3 mg/day (9.1/wk, 39/mo) — chicken, fish, potatoes, chickpeas
- B9 folate: 400 mcg/day (2,800/wk, 12,000/mo) — leafy greens, beans, citrus, fortified grains
- B12: 2.4 mcg/day (16.8/wk, 72/mo) — meat, fish, eggs, dairy, fortified foods
- C: 90 mg/day (630/wk, 2,700/mo) — oranges, strawberries, bell peppers, broccoli
- D: 600–800 IU/day (15–20 mcg) — weekly/monthly scales accordingly — sun, fatty fish, fortified milk, eggs
- E: 15 mg/day (105/wk, 450/mo) — nuts, seeds, spinach, avocado
- K: 120 mcg/day (840/wk, 3,600/mo) — kale, spinach, broccoli, Brussels sprouts

MINERALS
- Calcium: 1,000 mg/day (7,000/wk, 30,000/mo) — dairy, fortified plant milk, sardines, tofu
- Iron: 8 mg/day (56/wk, 240/mo) — red meat, spinach, lentils, fortified cereals
- Magnesium: 400–420 mg/day (2,800–2,940/wk, 12,000–12,600/mo) — nuts, seeds, whole grains, leafy greens
- Zinc: 11 mg/day (77/wk, 330/mo) — meat, shellfish, legumes, seeds
- Potassium: 3,400 mg/day (23,800/wk, 102,000/mo) — bananas, potatoes, spinach, beans
- Sodium: limit ~1,500–2,300 mg/day — salt, processed foods
- Selenium: 55 mcg/day (385/wk, 1,650/mo) — Brazil nuts, seafood, eggs, chicken
- Phosphorus: 700 mg/day (4,900/wk, 21,000/mo) — meat, dairy, nuts, whole grains
- Iodine: 150 mcg/day (1,050/wk, 4,500/mo) — iodized salt, seafood, dairy
- Chromium: 35 mcg/day (245/wk, 1,050/mo) — broccoli, grapes, whole grains
- Copper: 900 mcg/day (6,300/wk, 27,000/mo) — shellfish, nuts, seeds, organ meats
- Manganese: 2.3 mg/day (16.1/wk, 69/mo) — nuts, whole grains, tea, leafy greens

OMEGA-3 (EPA+DHA combined): ~1,600 mg/day (11,200/wk, 48,000/mo) — fatty fish, flax, chia, walnuts

When period_day_count is 7, micronutrient “weekly need” is a useful mental model; when 30, lean toward monthly/daily×30 framing.
`.trim();

export type EssentialNutrientSection = {
  id: string;
  title: string;
  /** Plain lines for display */
  lines: string[];
};

export const ESSENTIAL_NUTRIENT_REFERENCE_SECTIONS: EssentialNutrientSection[] = [
  {
    id: "macros",
    title: "Macronutrients (daily → weekly → monthly)",
    lines: [
      "Protein — Daily: 145–165g · Weekly: 1,015–1,155g (≈2.2–2.5 lb) · Monthly: 4,350–4,950g (≈9.6–10.9 lb)",
      "Fats — Daily: 65–75g · Weekly: 455–525g (≈1–1.2 lb) · Monthly: 1,950–2,250g (≈4.3–5 lb)",
      "Carbohydrates — Daily: 180–200g · Weekly: 1,260–1,400g (≈2.8–3.1 lb) · Monthly: 5,400–6,000g (≈11.9–13.2 lb)",
      "Fiber — Daily: 25–38g · Weekly: 175–266g · Monthly: 750–1,140g",
      "Water — Daily: 3–4 L (100–135 oz) · Weekly: 21–28 L · Monthly: 90–120 L",
    ],
  },
  {
    id: "vitamins",
    title: "Vitamins",
    lines: [
      "A — Daily: 900 mcg (3,000 IU) · Weekly: 6,300 mcg · Monthly: 27,000 mcg — carrots, sweet potatoes, spinach, liver",
      "B1 (Thiamine) — Daily: 1.2 mg · Weekly: 8.4 mg · Monthly: 36 mg — whole grains, pork, nuts, beans",
      "B2 (Riboflavin) — Daily: 1.3 mg · Weekly: 9.1 mg · Monthly: 39 mg — eggs, dairy, almonds, spinach",
      "B3 (Niacin) — Daily: 16 mg · Weekly: 112 mg · Monthly: 480 mg — chicken, tuna, turkey, peanuts",
      "B6 — Daily: 1.3 mg · Weekly: 9.1 mg · Monthly: 39 mg — chicken, fish, potatoes, chickpeas",
      "B9 (Folate) — Daily: 400 mcg · Weekly: 2,800 mcg · Monthly: 12,000 mcg — leafy greens, beans, citrus, fortified grains",
      "B12 — Daily: 2.4 mcg · Weekly: 16.8 mcg · Monthly: 72 mcg — meat, fish, eggs, dairy, fortified foods",
      "C — Daily: 90 mg · Weekly: 630 mg · Monthly: 2,700 mg — oranges, strawberries, bell peppers, broccoli",
      "D — Daily: 600–800 IU (15–20 mcg) · Weekly: 4,200–5,600 IU · Monthly: 18,000–24,000 IU — sunlight, fatty fish, fortified milk, eggs",
      "E — Daily: 15 mg · Weekly: 105 mg · Monthly: 450 mg — nuts, seeds, spinach, avocado",
      "K — Daily: 120 mcg · Weekly: 840 mcg · Monthly: 3,600 mcg — kale, spinach, broccoli, Brussels sprouts",
    ],
  },
  {
    id: "minerals",
    title: "Minerals",
    lines: [
      "Calcium — Daily: 1,000 mg · Weekly: 7,000 mg · Monthly: 30,000 mg — dairy, fortified plant milk, sardines, tofu",
      "Iron — Daily: 8 mg · Weekly: 56 mg · Monthly: 240 mg — red meat, spinach, lentils, fortified cereals",
      "Magnesium — Daily: 400–420 mg · Weekly: 2,800–2,940 mg · Monthly: 12,000–12,600 mg — nuts, seeds, whole grains, leafy greens",
      "Zinc — Daily: 11 mg · Weekly: 77 mg · Monthly: 330 mg — meat, shellfish, legumes, seeds",
      "Potassium — Daily: 3,400 mg · Weekly: 23,800 mg · Monthly: 102,000 mg — bananas, potatoes, spinach, beans",
      "Sodium — Daily: 1,500–2,300 mg (limit) · Weekly: 10,500–16,100 mg · Monthly: 45,000–69,000 mg — salt, processed foods",
      "Selenium — Daily: 55 mcg · Weekly: 385 mcg · Monthly: 1,650 mcg — Brazil nuts, seafood, eggs, chicken",
      "Phosphorus — Daily: 700 mg · Weekly: 4,900 mg · Monthly: 21,000 mg — meat, dairy, nuts, whole grains",
      "Iodine — Daily: 150 mcg · Weekly: 1,050 mcg · Monthly: 4,500 mcg — iodized salt, seafood, dairy",
      "Chromium — Daily: 35 mcg · Weekly: 245 mcg · Monthly: 1,050 mcg — broccoli, grapes, whole grains",
      "Copper — Daily: 900 mcg · Weekly: 6,300 mcg · Monthly: 27,000 mcg — shellfish, nuts, seeds, organ meats",
      "Manganese — Daily: 2.3 mg · Weekly: 16.1 mg · Monthly: 69 mg — nuts, whole grains, tea, leafy greens",
    ],
  },
  {
    id: "omega3",
    title: "Omega-3 fatty acids (EPA + DHA)",
    lines: [
      "Daily: ~1,600 mg combined · Weekly: ~11,200 mg · Monthly: ~48,000 mg — fatty fish, flaxseeds, chia seeds, walnuts",
    ],
  },
  {
    id: "planning",
    title: "Easy weekly meal planning checklist",
    lines: [
      "Protein (≈2.2–2.5 lb/week): chicken breast 3–4 lb; fish/salmon 1–2 lb; eggs 2 dozen; Greek yogurt 4–5 cups; protein powder optional 7 scoops",
      "Carbs (≈2.8–3.1 lb/week): rice/quinoa 2–3 cups dry; oats 1–2 cups dry; sweet potatoes 3–4 medium; whole grain bread 1 loaf; fruits 10–14 servings",
      "Fats (≈1–1.2 lb/week): olive oil ½ cup; nuts/seeds 1 cup; avocados 3–4; nut butter ½ cup",
      "Vegetables: leafy greens 2–3 bags; broccoli 2–3 crowns; bell peppers 5–7; carrots 1 bag; mixed veggies as needed",
    ],
  },
  {
    id: "grocery",
    title: "Monthly grocery estimate (rough)",
    lines: [
      "Protein ~10–12 lb · Carbs ~12–14 lb · Fats ~4–5 lb · Vegetables ~20–25 lb · Fruits ~15–20 lb · Dairy/alternatives ~8–10 lb",
    ],
  },
  {
    id: "supplements",
    title: "Supplements to consider if diet gaps exist",
    lines: [
      "Multivitamin · Vitamin D3 (low sun) · Omega-3/fish oil (if fish <2×/week) · Magnesium (cramps/sleep) · Protein powder (convenience) · Creatine 5g/day (muscle/strength)",
    ],
  },
  {
    id: "tips",
    title: "Tracking tips",
    lines: [
      "Prioritize protein day to day · Aim for 5+ vegetable servings/day · Vary protein sources weekly · Eat colorful foods · Aim for ~80% consistency over perfection",
    ],
  },
];
