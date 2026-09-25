"use client";

import { useRef, useState, type MouseEvent } from "react";
import { HQIcon } from "@/components/hq/icon";
import { HQButton, HQCallout, HQField } from "@/components/hq/primitives";
import { nutritionSummary } from "@/lib/nutrition/summary";
import { searchFoods, saveMeal } from "./actions";
import type { NutritionFood, NutritionSearchResult } from "@/lib/nutrition/types";

/**
 * Logging should take seconds: type what you had (or tap a recent food),
 * optionally match it to USDA data, save. Everything else is optional.
 */
export function MealForm({
  gentleFoodMode = false,
  recentFoods = [],
}: {
  gentleFoodMode?: boolean;
  recentFoods?: string[];
}) {
  const [result, setResult] = useState<NutritionSearchResult | null>(null);
  const [selected, setSelected] = useState<NutritionFood | null>(null);
  const [pending, setPending] = useState(false);
  const foodRef = useRef<HTMLInputElement>(null);

  async function onSearch(event: MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    if (!form) return;
    setPending(true);
    setSelected(null);
    const foods = await searchFoods(String(new FormData(form).get("foodName") ?? ""));
    setResult(foods);
    setPending(false);
  }

  function fillRecent(food: string) {
    if (!foodRef.current) return;
    foodRef.current.value = food;
    foodRef.current.focus();
    setResult(null);
    setSelected(null);
  }

  return (
    <form action={saveMeal} className="hq-log-form">
      {recentFoods.length > 0 ? (
        <div className="hq-stack" style={{ gap: 8 }}>
          <span className="hq-label">Recent</span>
          <div className="hq-recent">
            {recentFoods.map((food) => (
              <button key={food} type="button" onClick={() => fillRecent(food)}>
                {food}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <HQField label="Food" htmlFor="foodName" hint="Plain words are fine, like “oatmeal with banana”.">
        <input
          ref={foodRef}
          id="foodName"
          name="foodName"
          required
          autoComplete="off"
          className="hq-input"
          aria-describedby="foodName-hint"
        />
      </HQField>

      <div className="hq-log-form__row">
        <HQField label="Amount" htmlFor="quantity">
          <input id="quantity" name="quantity" inputMode="decimal" className="hq-input" placeholder="1" />
        </HQField>
        <HQField label="Unit" htmlFor="servingUnit">
          <input id="servingUnit" name="servingUnit" className="hq-input" placeholder="cup" />
        </HQField>
        <HQField label="Approximate cost, optional" htmlFor="approximateCost">
          <input id="approximateCost" name="approximateCost" inputMode="decimal" className="hq-input" placeholder="$" />
        </HQField>
      </div>

      <details className="hq-log-form__more">
        <summary>
          <HQIcon name="chevron-right" size={16} />
          Preparation and notes
        </summary>
        <div>
          <HQField label="Preparation" htmlFor="preparation">
            <input id="preparation" name="preparation" className="hq-input" placeholder="baked, raw, with milk…" />
          </HQField>
          <HQField label="Notes, optional" htmlFor="notes">
            <textarea id="notes" name="notes" rows={3} className="hq-textarea" />
          </HQField>
        </div>
      </details>

      <div className="hq-stack" style={{ gap: 12 }}>
        <HQButton type="button" icon="book" onClick={onSearch} disabled={pending}>
          {pending ? "Looking up…" : "Find nutrition match"}
        </HQButton>

        {result?.status === "matches" ? (
          <fieldset className="hq-stack" style={{ gap: 8, border: 0, padding: 0, margin: 0 }}>
            <legend className="hq-label" style={{ marginBottom: 8 }}>
              Choose the closest food. Nothing is selected for you.
            </legend>
            {result.foods.map((food) => (
              <label key={food.fdcId} className="hq-choice">
                <span aria-hidden />
                <span className="hq-choice__label">
                  {food.description}
                  <span className="hq-choice__hint">{food.demo ? "Sample data, not USDA" : food.sourceDataset}</span>
                </span>
                <input
                  type="radio"
                  name="fdcChoice"
                  checked={selected?.fdcId === food.fdcId}
                  onChange={() => setSelected(food)}
                />
              </label>
            ))}
          </fieldset>
        ) : null}

        {selected ? (
          <p className="hq-secondary" style={{ margin: 0 }}>
            {nutritionSummary(selected, gentleFoodMode)}
          </p>
        ) : null}

        {result?.status === "uncertain" || result?.status === "unavailable" ? (
          <HQCallout tone="neutral">{result.message}</HQCallout>
        ) : null}
      </div>

      <input type="hidden" name="fdcId" value={selected?.fdcId ?? ""} />
      <HQButton type="submit" variant="primary" block icon="check">
        Save meal
      </HQButton>
    </form>
  );
}

