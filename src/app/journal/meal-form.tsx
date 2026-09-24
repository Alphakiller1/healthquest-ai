"use client";

import { useState, type MouseEvent } from "react";
import { nutritionSummary } from "@/lib/nutrition/summary";
import { searchFoods, saveMeal } from "./actions";
import type { NutritionFood, NutritionSearchResult } from "@/lib/nutrition/types";

export function MealForm({ gentleFoodMode = false }: { gentleFoodMode?: boolean }) {
  const [result, setResult] = useState<NutritionSearchResult | null>(null);
  const [selected, setSelected] = useState<NutritionFood | null>(null);
  const [pending, setPending] = useState(false);

  async function onSearch(event: MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    if (!form) return;
    setPending(true);
    setSelected(null);
    const foods = await searchFoods(String(new FormData(form).get("foodName") ?? ""));
    setResult(foods);
    setPending(false);
  }

  return (
    <form action={saveMeal} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="foodName">
        Food
        <input id="foodName" name="foodName" required className="h-12 rounded-xl border border-zinc-300 px-3" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="quantity">
          Quantity
          <input id="quantity" name="quantity" className="h-12 rounded-xl border border-zinc-300 px-3" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="servingUnit">
          Unit
          <input id="servingUnit" name="servingUnit" className="h-12 rounded-xl border border-zinc-300 px-3" placeholder="cup, ounce, piece" />
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="preparation">
        Preparation
        <input id="preparation" name="preparation" className="h-12 rounded-xl border border-zinc-300 px-3" />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="approximateCost">
        Approximate cost, optional
        <input id="approximateCost" name="approximateCost" className="h-12 rounded-xl border border-zinc-300 px-3" />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="notes">
        Notes, optional
        <textarea id="notes" name="notes" rows={3} className="rounded-xl border border-zinc-300 px-3 py-2" />
      </label>
      <button
        className="h-12 rounded-full border border-teal-800 px-5 text-teal-900"
        type="button"
        onClick={onSearch}
        disabled={pending}
      >
        {pending ? "Looking up…" : "Find nutrition match"}
      </button>
      {result?.status === "matches" ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium">Choose the closest food. Nothing is selected for you.</legend>
          {result.foods.map((food) => (
            <label key={food.fdcId} className="flex items-start gap-3 rounded-xl border border-zinc-200 p-3 leading-6">
              <input
                className="mt-1 h-5 w-5"
                type="radio"
                name="fdcChoice"
                checked={selected?.fdcId === food.fdcId}
                onChange={() => setSelected(food)}
              />
              <span>
                <span className="font-medium">{food.description}</span>
                <span className="block text-sm text-zinc-600">
                  {food.demo ? "Sample data, not USDA" : food.sourceDataset}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
      ) : null}
      {selected ? (
        <p className="leading-6 text-sm text-zinc-700">{nutritionSummary(selected, gentleFoodMode)}</p>
      ) : null}
      {result?.status === "uncertain" || result?.status === "unavailable" ? (
        <p className="leading-6">{result.message}</p>
      ) : null}
      <input type="hidden" name="fdcId" value={selected?.fdcId ?? ""} />
      <button className="h-12 rounded-full bg-teal-800 px-5 text-white" type="submit">
        Save meal
      </button>
    </form>
  );
}
