import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Newsreader } from "next/font/google";
import { HQAppShell } from "@/components/hq/shell";
import { PREFERENCES_BOOT_SCRIPT } from "@/components/hq/preferences";
import { readSession } from "@/lib/demo/session";
import { getDemoStore } from "@/lib/demo/store";
import "./globals.css";

const sans = Hanken_Grotesk({
  variable: "--font-hq-sans",
  subsets: ["latin"],
});

const serif = Newsreader({
  variable: "--font-hq-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "HealthQuest AI",
  description:
    "Educational wellness guidance for adults. Not medical advice, diagnosis, or treatment.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f1e9" },
    { media: "(prefers-color-scheme: dark)", color: "#111714" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await readSession();
  const user = session ? (await getDemoStore()).getUser(session.userId) : null;
  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable}${user?.highContrast ? " hq-contrast" : ""}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFERENCES_BOOT_SCRIPT }} />
      </head>
      <body>
        <a href="#content" className="hq-skip-link">
          Skip to content
        </a>
        <HQAppShell>{children}</HQAppShell>
      </body>
    </html>
  );
}
