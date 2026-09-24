"use client";

import { useEffect, useState, type CSSProperties } from "react";

type Theme = "system" | "light" | "dark";
type Motion = "system" | "reduce";

const KEYS = { theme: "hq-theme", motion: "hq-motion" } as const;

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    if (value === "system") window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage can be blocked. The choice still applies for this visit.
  }
}

function apply(attribute: "theme" | "motion", value: string) {
  const root = document.documentElement;
  if (value === "system") delete root.dataset[attribute];
  else root.dataset[attribute] = value;
}

/** Runs before paint (inlined in the root layout) so a saved theme never flashes. */
export const PREFERENCES_BOOT_SCRIPT = `(function(){try{var d=document.documentElement,s=localStorage;var t=s.getItem("${KEYS.theme}");if(t)d.dataset.theme=t;var m=s.getItem("${KEYS.motion}");if(m)d.dataset.motion=m;}catch(e){}})();`;

function Segmented<T extends string>({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="hq-field" style={{ border: 0, padding: 0, margin: 0 }}>
      <legend className="hq-field__label" style={{ marginBottom: 8 }}>
        {legend}
      </legend>
      <div className="hq-cluster" role="radiogroup">
        {options.map((option) => (
          <label key={option.value} className="hq-choice" style={{ minHeight: 44, gridTemplateColumns: "1fr auto", padding: "0 12px" }}>
            <span className="hq-choice__label" style={{ fontSize: "0.875rem" }}>
              {option.label}
            </span>
            <input
              type="radio"
              name={legend}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              style={{ gridColumn: 2 }}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Theme and motion, stored per device. Contrast is an account setting (Settings). */
export function HQPreferenceControls() {
  const [theme, setTheme] = useState<Theme>("system");
  const [motion, setMotion] = useState<Motion>("system");

  useEffect(() => {
    // Hydrate from what the boot script already applied.
    const root = document.documentElement.dataset;
    /* eslint-disable react-hooks/set-state-in-effect */
    setTheme((root.theme as Theme) ?? (read(KEYS.theme) as Theme) ?? "system");
    setMotion((root.motion as Motion) ?? "system");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  return (
    <div className="hq-stack" style={{ "--hq-stack-gap": "20px" } as CSSProperties}>
      <Segmented
        legend="Theme"
        value={theme}
        options={[
          { value: "system", label: "Match device" },
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
        ]}
        onChange={(value) => {
          setTheme(value);
          apply("theme", value);
          write(KEYS.theme, value);
        }}
      />
      <Segmented
        legend="Motion"
        value={motion}
        options={[
          { value: "system", label: "Match device" },
          { value: "reduce", label: "Reduce motion" },
        ]}
        onChange={(value) => {
          setMotion(value);
          apply("motion", value);
          write(KEYS.motion, value);
        }}
      />
    </div>
  );
}
