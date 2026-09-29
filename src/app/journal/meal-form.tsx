"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type Ref } from "react";
import { useFormStatus } from "react-dom";
import { HQIcon } from "@/components/hq/icon";
import { HQButton, HQField } from "@/components/hq/primitives";
import { nutrientFacts, splitFoodName, type NutrientFact, type NutrientFocus } from "@/lib/nutrition/focus";
import type { NutritionFood, NutritionSearchResult } from "@/lib/nutrition/types";
import type { MealNutrition, MealPortion, MealSlot } from "@/lib/demo/store";
import { saveMeal, searchFoods } from "./actions";

/** A meal the person has logged before, ready to repeat in one tap. */
export type UsualMeal = {
  foodName: string;
  portion?: MealPortion;
  quantity: string;
  servingUnit: string;
  preparation: string;
  fdcId: string | null;
  nutrition: MealNutrition | null;
  times: number;
};

const SLOTS: { id: MealSlot; label: string }[] = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "snack", label: "Snack" },
];

const PORTIONS: { id: MealPortion; label: string }[] = [
  { id: "small", label: "Small" },
  { id: "regular", label: "Regular" },
  { id: "large", label: "Large" },
];

const noSubscribe = () => () => {};

/** A sensible default from the clock; one tap changes it. */
function slotForNow(date = new Date()): MealSlot {
  const hour = date.getHours();
  if (hour >= 4 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 15) return "lunch";
  if (hour >= 17 && hour < 22) return "dinner";
  return "snack";
}

type Lookup =
  | { state: "idle" }
  | { state: "looking"; query: string }
  | { state: "done"; query: string; result: NutritionSearchResult };

/** The facts a picked match carries, whether it came from a search or from "your usual". */
type Picked = { fdcId: string; description: string; source: string; facts: NutrientFact[]; servingLabel: string };

function pickFromSearch(food: NutritionFood, focus: readonly NutrientFocus[], gentle: boolean): Picked {
  return {
    fdcId: food.fdcId,
    description: food.description,
    source: food.demo ? "Sample data, not USDA" : "USDA FoodData Central",
    facts: nutrientFacts(food, focus, gentle),
    servingLabel: food.servingLabel,
  };
}

/**
 * Logging should take seconds: say what you had, tap Save. When of the day is
 * pre-set from the clock, size is optional, and nutrition facts are offered —
 * never chosen for you — while you type. Your usual meals repeat in one tap.
 */
export function MealForm({
  gentleFoodMode = false,
  usual = [],
  focus = [],
}: {
  gentleFoodMode?: boolean;
  usual?: UsualMeal[];
  focus?: NutrientFocus[];
}) {
  const [food, setFood] = useState("");
  const [chosenSlot, setSlot] = useState<MealSlot | null>(null);
  // The clock is read in the browser (null while server-rendering), so the default is the person's own time of day.
  const clockSlot = useSyncExternalStore(noSubscribe, () => slotForNow(), () => null);
  const slot = chosenSlot ?? clockSlot;
  const [portion, setPortion] = useState<MealPortion | null>(null);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [lookup, setLookup] = useState<Lookup>({ state: "idle" });
  const [showAll, setShowAll] = useState(false);
  const [filledFrom, setFilledFrom] = useState<UsualMeal | null>(null);
  const [detailsKey, setDetailsKey] = useState(0);
  const request = useRef(0);
  const saveRef = useRef<HTMLButtonElement>(null);
  const matchesId = useId();

  // Look the food up after a short pause in typing. Nothing is picked automatically.
  useEffect(() => {
    const query = food.trim();
    if (picked || query.length < 3) return;
    const id = ++request.current;
    const timer = setTimeout(async () => {
      setLookup({ state: "looking", query });
      const result = await searchFoods(query);
      if (id === request.current) setLookup({ state: "done", query, result });
    }, 700);
    return () => clearTimeout(timer);
  }, [food, picked]);

  function onFoodChange(value: string) {
    setFood(value);
    setShowAll(false);
    if (picked) setPicked(null);
    if (filledFrom && value !== filledFrom.foodName) setFilledFrom(null);
  }

  function repeat(meal: UsualMeal) {
    setFood(meal.foodName);
    setPortion(meal.portion ?? null);
    setPicked(
      meal.fdcId && meal.nutrition
        ? {
            fdcId: meal.fdcId,
            description: meal.nutrition.description,
            source: meal.nutrition.sourceDataset,
            facts: nutrientFacts(meal.nutrition, focus, gentleFoodMode),
            servingLabel: meal.nutrition.servingLabel,
          }
        : null,
    );
    setFilledFrom(meal);
    setDetailsKey((key) => key + 1);
    requestAnimationFrame(() => saveRef.current?.focus());
  }

  // A lookup only shows while it still matches what is typed.
  const current: Lookup = !picked && lookup.state !== "idle" && lookup.query === food.trim() ? lookup : { state: "idle" };
  const matches = current.state === "done" && current.result.status === "matches" ? current.result.foods : [];
  const visibleMatches = showAll ? matches.slice(0, 6) : matches.slice(0, 3);
  const slotLabel = SLOTS.find((item) => item.id === slot)?.label.toLowerCase();

  return (
    <form action={saveMeal} className="hq-meal-form">
      {usual.length > 0 ? (
        <section className="hq-meal-usual" aria-labelledby="usual-title">
          <h2 id="usual-title" className="hq-label">
            Your usual
          </h2>
          <div className="hq-meal-usual__row">
            {usual.map((meal) => (
              <button
                key={meal.foodName}
                type="button"
                className="hq-meal-usual__chip"
                aria-pressed={filledFrom?.foodName === meal.foodName}
                onClick={() => repeat(meal)}
              >
                <HQIcon name="bowl" size={16} />
                {meal.foodName}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <HQField label="Food" htmlFor="foodName" hint="Say it your way, like “oatmeal with banana” or “leftover pizza”.">
        <input
          id="foodName"
          name="foodName"
          required
          maxLength={120}
          autoComplete="off"
          enterKeyHint="done"
          className="hq-input"
          value={food}
          onChange={(event) => onFoodChange(event.target.value)}
          aria-describedby="foodName-hint"
          aria-controls={matchesId}
        />
      </HQField>

      {filledFrom ? (
        <p className="hq-meal-note" role="status">
          <HQIcon name="check" size={16} />
          Filled in from last time. Change anything, then save.
        </p>
      ) : null}

      <div id={matchesId} aria-live="polite" className="hq-meal-match">
        {picked ? (
          <div className="hq-meal-picked">
            <p className="hq-meal-picked__head">
              <HQIcon name="check" size={18} />
              <span>
                <span className="hq-meal-picked__title">
                  Nutrition facts added: {splitFoodName(picked.description).name}
                  {splitFoodName(picked.description).detail ? (
                    <span className="hq-meal-picked__detail">, {splitFoodName(picked.description).detail}</span>
                  ) : null}
                </span>
                <span className="hq-micro">
                  You picked this · {picked.source} · {picked.servingLabel}
                </span>
              </span>
            </p>
            <FactRow facts={picked.facts} />
            <button type="button" className="hq-textbutton" onClick={() => setPicked(null)}>
              Remove nutrition facts
            </button>
          </div>
        ) : current.state === "looking" ? (
          <p className="hq-meal-note hq-meal-note--quiet">
            <span className="hq-dot-pulse" aria-hidden />
            Looking up “{current.query}” in the USDA food database…
          </p>
        ) : matches.length > 0 ? (
          <fieldset className="hq-meal-suggest">
            <legend>
              <span className="hq-meal-suggest__title">Add nutrition facts? Optional</span>
              <span className="hq-meal-suggest__hint">
                These are suggestions from the USDA food database. Tap the one closest to what you had, or skip it — your
                meal saves either way.
              </span>
            </legend>
            {visibleMatches.map((option) => {
              const name = splitFoodName(option.description);
              const facts = nutrientFacts(option, focus, gentleFoodMode);
              return (
                <button
                  key={option.fdcId}
                  type="button"
                  className="hq-meal-option"
                  onClick={() => {
                    setPicked(pickFromSearch(option, focus, gentleFoodMode));
                    requestAnimationFrame(() => saveRef.current?.focus());
                  }}
                >
                  <span className="hq-meal-option__name">
                    {name.name}
                    {name.detail ? <span className="hq-meal-option__detail">{name.detail}</span> : null}
                  </span>
                  <FactRow facts={facts} compact />
                  <span className="hq-meal-option__cta" aria-hidden>
                    Use this
                  </span>
                </button>
              );
            })}
            {matches.length > 3 && !showAll ? (
              <button type="button" className="hq-textbutton" onClick={() => setShowAll(true)}>
                Show more matches
              </button>
            ) : null}
            {focus.length > 0 ? (
              <p className="hq-micro" style={{ margin: 0 }}>
                <span className="hq-fact__focus-key">Your focus</span> shows first because {focus[0].reason}.
              </p>
            ) : null}
          </fieldset>
        ) : current.state === "done" ? (
          <p className="hq-meal-note hq-meal-note--quiet">
            <HQIcon name="info" size={16} />
            {current.result.status === "unavailable"
              ? "Nutrition lookup is resting right now. Your meal still saves."
              : `No close match for “${current.query}” in the USDA database. That’s fine — your meal still saves.`}
          </p>
        ) : null}
      </div>

      <fieldset className="hq-segment hq-meal-slots">
        <legend>When</legend>
        {SLOTS.map((item) => (
          <label key={item.id}>
            <input
              type="radio"
              name="mealSlot"
              value={item.id}
              checked={slot === item.id}
              onChange={() => setSlot(item.id)}
            />
            {item.label}
          </label>
        ))}
      </fieldset>

      <div className="hq-meal-portion" role="group" aria-labelledby="portion-label">
        <span id="portion-label" className="hq-meal-portion__label">
          How much? <span className="hq-micro">Optional</span>
        </span>
        <div className="hq-meal-portion__row">
          {PORTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={portion === item.id}
              onClick={() => setPortion(portion === item.id ? null : item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <input type="hidden" name="portion" value={portion ?? ""} />
      </div>

      <input type="hidden" name="fdcId" value={picked?.fdcId ?? ""} />
      <SaveButton ref={saveRef} label={food.trim() && slotLabel ? `Save ${slotLabel}` : "Save meal"} />

      <details className="hq-log-form__more" key={detailsKey}>
        <summary>
          <HQIcon name="chevron-right" size={16} />
          More details: exact amount, how it was made, cost, notes
        </summary>
        <div>
          <div className="hq-log-form__row">
            <HQField label="Amount" htmlFor="quantity">
              <input id="quantity" name="quantity" maxLength={20} inputMode="decimal" className="hq-input" placeholder="1" defaultValue={filledFrom?.quantity} />
            </HQField>
            <HQField label="Unit" htmlFor="servingUnit">
              <input id="servingUnit" name="servingUnit" maxLength={30} className="hq-input" placeholder="cup, slice, bowl" defaultValue={filledFrom?.servingUnit} />
            </HQField>
          </div>
          <HQField label="How it was made" htmlFor="preparation">
            <input id="preparation" name="preparation" maxLength={120} className="hq-input" placeholder="baked, fried, with milk…" defaultValue={filledFrom?.preparation} />
          </HQField>
          <HQField label="Approximate cost, optional" htmlFor="approximateCost">
            <input id="approximateCost" name="approximateCost" maxLength={12} inputMode="decimal" className="hq-input" placeholder="$" />
          </HQField>
          <HQField label="Notes, optional" htmlFor="notes">
            <textarea id="notes" name="notes" rows={3} maxLength={500} className="hq-textarea" />
          </HQField>
        </div>
      </details>
    </form>
  );
}

function FactRow({ facts, compact = false }: { facts: NutrientFact[]; compact?: boolean }) {
  if (facts.length === 0) return null;
  return (
    <span className="hq-facts" data-compact={compact || undefined}>
      {facts.map((fact) => (
        <span key={fact.key} className="hq-fact" data-focus={fact.focus || undefined}>
          {fact.focus ? <span className="hq-fact__focus-key">Your focus</span> : null}
          <span className="hq-fact__label">{fact.label}</span> {fact.value}
        </span>
      ))}
    </span>
  );
}

function SaveButton({ label, ref }: { label: string; ref: Ref<HTMLButtonElement> }) {
  const { pending } = useFormStatus();
  return (
    <HQButton ref={ref} type="submit" variant="primary" block icon="check" disabled={pending}>
      {pending ? "Saving…" : label}
    </HQButton>
  );
}
