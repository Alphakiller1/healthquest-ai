"use client";

import { useState, useTransition } from "react";
import type { MomentResult } from "@/app/now/actions";
import { HQIcon, type HQIconName } from "@/components/hq/icon";
import { HQButton, HQCallout, HQField } from "@/components/hq/primitives";
import { compareLines, type NutrientRow } from "@/lib/moments/food";
import type { NutritionFood, NutritionSearchResult } from "@/lib/nutrition/types";
import { WinCard, type SourceLine } from "./moments";

type Situation = { id: string; label: string; hint: string; icon: HQIconName; tips: { id: string; text: string; sourceId: string }[] };

export function FoodMoment({
  situations,
  sources,
  search,
  complete,
  gentleFoodMode,
}: {
  situations: Situation[];
  sources: Record<string, SourceLine>;
  search: (query: string) => Promise<NutritionSearchResult>;
  complete: (input: { kind: "food" }) => Promise<MomentResult>;
  gentleFoodMode: boolean;
}) {
  const [situation, setSituation] = useState<string | null>(null);
  const [result, setResult] = useState<MomentResult | null>(null);
  const [pending, startTransition] = useTransition();
  const current = situations.find((item) => item.id === situation);

  function done() {
    startTransition(async () => setResult(await complete({ kind: "food" })));
  }

  if (result) {
    return <WinCard result={result} again={() => { setResult(null); setSituation(null); }} againLabel="Another food question" />;
  }

  return (
    <div className="hq-stack" style={{ gap: 28 }}>
      <section className="hq-stack" style={{ gap: 10 }} aria-labelledby="where-title">
        <h2 id="where-title" className="hq-label" style={{ margin: 0 }}>
          Where are you choosing?
        </h2>
        <div className="hq-now-grid" data-compact>
          {situations.map((item) => (
            <button
              key={item.id}
              type="button"
              className="hq-now-tile"
              aria-pressed={situation === item.id}
              onClick={() => setSituation(item.id)}
            >
              <HQIcon name={item.icon} size={22} />
              <span className="hq-now-tile__title">{item.label}</span>
              <span className="hq-micro">{item.hint}</span>
            </button>
          ))}
        </div>
      </section>

      {current ? (
        <section className="hq-stack" style={{ gap: 12 }} aria-labelledby="tips-title" aria-live="polite">
          <h2 id="tips-title" className="hq-section-title" style={{ margin: 0 }}>
            {current.label}: things worth knowing
          </h2>
          <ul className="hq-answer__steps">
            {current.tips.map((tip) => (
              <li key={tip.id}>
                {tip.text}{" "}
                {sources[tip.sourceId] ? (
                  <a className="hq-micro" href={sources[tip.sourceId].url}>
                    {sources[tip.sourceId].organization}
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
          <HQButton variant="primary" block icon="check" onClick={done} disabled={pending}>
            Got it
          </HQButton>
        </section>
      ) : null}

      <Compare search={search} gentleFoodMode={gentleFoodMode} onDone={done} />
    </div>
  );
}

function Picker({
  label,
  id,
  search,
  value,
  onPick,
}: {
  label: string;
  id: string;
  search: (query: string) => Promise<NutritionSearchResult>;
  value: NutritionFood | null;
  onPick: (food: NutritionFood | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NutritionSearchResult | null>(null);
  const [pending, startTransition] = useTransition();

  if (value) {
    return (
      <div className="hq-choice" style={{ gridTemplateColumns: "1fr auto" }}>
        <span className="hq-choice__label">
          {value.description}
          <span className="hq-choice__hint">{value.demo ? "Sample data, not USDA" : value.sourceDataset}</span>
        </span>
        <HQButton size="sm" variant="quiet" onClick={() => onPick(null)}>
          Change
        </HQButton>
      </div>
    );
  }

  return (
    <div className="hq-stack" style={{ gap: 8 }}>
      <HQField label={label} htmlFor={id}>
        <div className="hq-cluster" style={{ flexWrap: "nowrap" }}>
          <input
            id={id}
            className="hq-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                startTransition(async () => setResults(await search(query)));
              }
            }}
            placeholder="e.g. white rice"
            autoComplete="off"
          />
          <HQButton
            icon="arrow-right"
            aria-label={`Look up ${label.toLowerCase()}`}
            disabled={pending || query.trim().length < 2}
            onClick={() => startTransition(async () => setResults(await search(query)))}
          >
            {pending ? "…" : "Find"}
          </HQButton>
        </div>
      </HQField>
      {results?.status === "matches"
        ? results.foods.slice(0, 4).map((food) => (
            <button key={food.fdcId} type="button" className="hq-move-option" onClick={() => onPick(food)}>
              <span className="hq-move-option__name">{food.description}</span>
              <span className="hq-micro">{food.demo ? "Sample data, not USDA" : food.sourceDataset}</span>
              <HQIcon name="check" size={18} />
            </button>
          ))
        : results
          ? <HQCallout tone="neutral">{results.message}</HQCallout>
          : null}
    </div>
  );
}

function Compare({
  search,
  gentleFoodMode,
  onDone,
}: {
  search: (query: string) => Promise<NutritionSearchResult>;
  gentleFoodMode: boolean;
  onDone: () => void;
}) {
  const [a, setA] = useState<NutritionFood | null>(null);
  const [b, setB] = useState<NutritionFood | null>(null);

  const rows: NutrientRow[] = a && b
    ? [
        ...(gentleFoodMode ? [] : [{ key: "calories", label: "Calories", unit: "kcal", a: a.calories, b: b.calories }]),
        { key: "fiber", label: "Fiber", unit: "g", a: a.fiber, b: b.fiber },
        { key: "protein", label: "Protein", unit: "g", a: a.protein, b: b.protein },
        { key: "saturatedFat", label: "Saturated fat", unit: "g", a: a.saturatedFat, b: b.saturatedFat },
        { key: "sodium", label: "Sodium", unit: "mg", a: a.sodium, b: b.sodium },
        { key: "sugars", label: "Sugars", unit: "g", a: a.sugars, b: b.sugars },
      ]
    : [];
  // Two parts of the USDA name ("Rice, white") tell foods apart; if they still match, fall back to position.
  const label = (food: NutritionFood) => food.description.split(",").slice(0, 2).map((part) => part.trim()).join(", ").slice(0, 32);
  const names: [string, string] = a && b && label(a) === label(b) ? ["First food", "Second food"] : a && b ? [label(a), label(b)] : ["", ""];
  const lines = a && b ? compareLines(rows, names) : [];
  const fmt = (value: number | null, unit: string) => (value === null ? "—" : `${value >= 10 ? Math.round(value) : Math.round(value * 10) / 10} ${unit}`);

  return (
    <section className="hq-surface hq-stack" style={{ gap: 14 }} aria-labelledby="compare-title">
      <div>
        <h2 id="compare-title" className="hq-section-title" style={{ margin: 0 }}>
          Compare two foods
        </h2>
        <p className="hq-micro" style={{ margin: "4px 0 0" }}>
          From USDA FoodData Central, for the same amount of each. Differences, not verdicts.
        </p>
      </div>
      <Picker label="First food" id="food-a" search={search} value={a} onPick={setA} />
      <Picker label="Second food" id="food-b" search={search} value={b} onPick={setB} />
      {a && b ? (
        <>
          <table className="hq-compare">
            <caption className="hq-sr-only">Nutrients per {a.servingLabel}</caption>
            <thead>
              <tr>
                <th scope="col">Per {a.servingLabel.replace(/^per /, "")}</th>
                <th scope="col">{names[0]}</th>
                <th scope="col">{names[1]}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  <td>{fmt(row.a, row.unit)}</td>
                  <td>{fmt(row.b, row.unit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {lines.length > 0 ? (
            <ul className="hq-answer__steps">
              {lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className="hq-secondary" style={{ margin: 0 }}>These two are close on the numbers shown.</p>
          )}
          <p className="hq-micro" style={{ margin: 0 }}>
            Labels list nutrients per serving, which can differ from this. What fits you depends on more than one number.
          </p>
          <HQButton variant="primary" block icon="check" onClick={onDone}>
            Done comparing
          </HQButton>
        </>
      ) : null}
    </section>
  );
}
