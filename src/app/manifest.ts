import type { MetadataRoute } from "next";

/**
 * Lets HealthQuest be added to a phone's home screen and open full screen.
 * No service worker: health data is never cached offline (see privacy docs).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HealthQuest",
    short_name: "HealthQuest",
    description: "Understand one more thing about your health, and take one more step.",
    start_url: "/today",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f1e9",
    theme_color: "#f4f1e9",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
