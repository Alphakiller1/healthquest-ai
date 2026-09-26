"use client";

/** Last resort when the app frame itself fails. Plain HTML so it works even if styles don't load. */
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "32px 20px", maxWidth: 560, margin: "0 auto", lineHeight: 1.5 }}>
        <h1 style={{ fontSize: 26 }}>Sorry — HealthQuest didn&rsquo;t load</h1>
        <p>It&rsquo;s on our side. Please try again in a moment.</p>
        <button type="button" onClick={() => retry()} style={{ minHeight: 48, padding: "0 20px", fontSize: 16 }}>
          Try again
        </button>
        <p>
          If you need help right now, call or text <a href="tel:988">988</a>. In an emergency, call <a href="tel:911">911</a>.
        </p>
      </body>
    </html>
  );
}
