import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GOODFORM - Everyday Supplements for India",
    short_name: "GOODFORM",
    description:
      "Better inputs. More good days. Single-brand daily nutrition with transparent elemental dosing and FSSAI publishing gates.",
    start_url: "/",
    display: "standalone",
    background_color: "#fcf8f2",
    theme_color: "#2b1429",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
