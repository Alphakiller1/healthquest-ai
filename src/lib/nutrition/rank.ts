import type { NutritionFood } from "./types";

/*
 * USDA's own search order is weak for everyday words: "apple" returns
 * croissants and strudel first, "oatmeal" returns oatmeal bread and cookies,
 * "coffee" returns soymilk and liqueur. This ranks the food itself (raw,
 * cooked, brewed) above things made with it, baby food, powders, and brands.
 */

/**
 * Everyday words USDA files under other names, searched alongside the
 * person's words. `name` is how USDA names the food; `words` narrow it.
 */
const ALIASES: Record<string, { name: string; words: string }> = {
  oatmeal: { name: "oats", words: "cooked with water" },
  "oat meal": { name: "oats", words: "cooked with water" },
  porridge: { name: "oats", words: "cooked with water" },
  rice: { name: "rice white", words: "cooked" },
  egg: { name: "egg whole", words: "cooked" },
  eggs: { name: "egg whole", words: "cooked" },
  coffee: { name: "coffee", words: "brewed" },
  tea: { name: "tea", words: "brewed" },
  toast: { name: "bread", words: "toasted" },
  apple: { name: "apples", words: "raw with skin" },
  apples: { name: "apples", words: "raw with skin" },
  salmon: { name: "salmon", words: "cooked" },
  chicken: { name: "chicken breast", words: "meat only cooked roasted" },
  "chicken breast": { name: "chicken breast", words: "meat only cooked roasted" },
  beans: { name: "beans", words: "cooked boiled" },
  "black beans": { name: "beans black", words: "mature seeds cooked" },
  pasta: { name: "pasta", words: "cooked" },
  potato: { name: "potatoes", words: "baked" },
  potatoes: { name: "potatoes", words: "baked" },
};

export type FoodAlias = { name: string; words: string };

export function aliasFor(query: string): FoodAlias | null {
  return ALIASES[query.trim().toLowerCase()] ?? null;
}

/** The text sent to USDA for an alias. */
export function aliasQuery(alias: FoodAlias): string {
  return `${alias.name} ${alias.words}`;
}

/** Group names USDA puts first; the food itself is the next part ("Beverages, coffee, brewed"). */
const GROUP_HEADS = new Set(["cereals", "beverages", "snacks", "fast foods", "restaurant", "spices", "fish", "alcoholic beverage"]);

/** Forms people rarely mean unless they say so. */
const UNLESS_ASKED = ["babyfood", "dried", "dehydrated", "powder", "dry mix", "flour", "dough", "juice", "oil", "alcoholic", "liqueur", "substitute", "bran"];

/** Things made from or around a food; the food itself should come first. */
const MADE_FROM = [
  "cookies", "croissant", "strudel", "bread", "muffin", "bagel", "cake", "pie", "roll", "sliced", "deli", "lunchmeat",
  "nugget", "breaded", "soup", "sauce", "canned", "frozen", "fat-free", "flavor", "restaurant", "fast foods",
  "commercially prepared", "snacks", "chips", "butter", "rotisserie", "prepackaged", "tenders", "mix",
];

/** Added flavours: the plain food comes first unless one is asked for. */
const FLAVOURS = ["cinnamon", "raisin", "spice", "sweetened", "honey", "maple", "flavored", "sugar", "chocolate", "strawberry"];

/** "berries" → "berry", "potatoes" → "potato", "apples" → "apple", "glass" stays. */
function singular(word: string): string {
  if (/ies$/.test(word)) return word.slice(0, -3) + "y";
  if (/(s|x|z|ch|sh|o)es$/.test(word)) return word.slice(0, -2);
  if (/[^s]s$/.test(word)) return word.slice(0, -1);
  return word;
}
const words = (text: string) => text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map(singular);

/**
 * How well a USDA entry is the food asked for. `name` are the words that make
 * up the food's name; `all` includes the narrowing words too.
 */
function score(food: NutritionFood, name: string[], all: string[], asked: string): number {
  const lower = food.description.toLowerCase();
  const segments = lower.split(",").map((part) => part.trim());
  const named = GROUP_HEADS.has(segments[0]) && segments[1] ? segments.slice(1) : segments;
  const present = new Set(words(lower));
  // USDA often splits a name over its first two parts: "Chicken, breast", "Beans, black".
  const nameZone = words(named.slice(0, 2).join(" "));
  const sameSet = (list: string[]) => list.length === name.length && name.every((term) => list.includes(term));

  let points = all.filter((term) => present.has(term)).length;
  if (name.every((term) => nameZone.includes(term))) points += 4;
  if (sameSet(words(named[0] ?? "")) || sameSet(nameZone)) points += 2;
  if (/\b(raw|cooked|brewed|baked|boiled|roasted|steamed|scrambled|prepared)\b/.test(lower)) points += 0.5;
  for (const form of UNLESS_ASKED) if (lower.includes(form) && !asked.includes(form)) points -= 3;
  for (const form of MADE_FROM) if (new RegExp("\\b" + form).test(lower) && !asked.includes(form)) points -= 1.5;
  for (const flavour of FLAVOURS) if (lower.includes(flavour) && !asked.includes(flavour)) points -= 1;
  // Brand names are written in capitals ("PIZZA HUT", "McDONALD'S", "SILK").
  if (/\b[A-Z][A-Z'&]{2,}\b/.test(food.description) && !/^[A-Z\s]+$/.test(food.description)) points -= 2;
  return points - segments.length * 0.15;
}

/**
 * Keeps foods that contain every word asked for (or the alias's name), or, if
 * none do, any of them; best match first.
 */
export function rankUsdaMatches(query: string, foods: NutritionFood[], alias: FoodAlias | null = null): NutritionFood[] {
  const asked = query.toLowerCase();
  const terms = words(query).filter((term) => term.length > 2);
  if (terms.length === 0) return foods;
  const aliasName = alias ? words(alias.name) : [];
  const aliasAll = alias ? [...aliasName, ...words(alias.words).filter((term) => term.length > 2)] : [];
  const contains = (food: NutritionFood, list: string[]) => {
    const present = new Set(words(food.description));
    return list.length > 0 && list.every((term) => present.has(term));
  };
  const strict = foods.filter((food) => contains(food, terms) || contains(food, aliasName));
  const pool = strict.length > 0 ? strict : foods.filter((food) => [...terms, ...aliasName].some((term) => contains(food, [term])));
  const seen = new Set<string>();
  return pool
    .filter((food) => (seen.has(food.fdcId) ? false : (seen.add(food.fdcId), true)))
    .map((food) => ({
      food,
      points: Math.max(score(food, terms, terms, asked), alias ? score(food, aliasName, aliasAll, asked) : -Infinity),
    }))
    .sort((a, b) => b.points - a.points)
    .map((item) => item.food);
}
