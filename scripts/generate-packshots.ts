import fs from "node:fs";
import path from "node:path";
import { PACKSHOT_SPECS, type PackshotSpec } from "../src/lib/packshot-manifest";

const COLLECTION_PALETTE: Record<
  PackshotSpec["collection"],
  { band: string; bandInk: string; glow: string; bgTop: string; bgBottom: string }
> = {
  foundations: {
    band: "#2B1429",
    bandInk: "#FCF8F2",
    glow: "#D9C7E8",
    bgTop: "#FBF6EE",
    bgBottom: "#EFE5D6",
  },
  omega: {
    band: "#C8432B",
    bandInk: "#FFFDF9",
    glow: "#F7C5B8",
    bgTop: "#FDF6F2",
    bgBottom: "#F4E4DC",
  },
  gut: {
    band: "#21573E",
    bandInk: "#F6FBF8",
    glow: "#BFE3D0",
    bgTop: "#F6FAF7",
    bgBottom: "#E3EFE8",
  },
  beauty: {
    band: "#5B3B8C",
    bandInk: "#FAF7FE",
    glow: "#D9CBF2",
    bgTop: "#FAF7FD",
    bgBottom: "#ECE4F6",
  },
  sleep: {
    band: "#3E2A5C",
    bandInk: "#FAF7FE",
    glow: "#CEC2E8",
    bgTop: "#F7F5FB",
    bgBottom: "#E6E0F2",
  },
  active: {
    band: "#B83B24",
    bandInk: "#FFFDF9",
    glow: "#F5C2B4",
    bgTop: "#FCF6F2",
    bgBottom: "#F1E3DA",
  },
  vitamins: {
    band: "#8A520A",
    bandInk: "#FFFDF9",
    glow: "#F2D8A7",
    bgTop: "#FDF9F0",
    bgBottom: "#F3E7CF",
  },
  antioxidants: {
    band: "#3B1836",
    bandInk: "#FCF8F2",
    glow: "#E4C2DF",
    bgTop: "#FCF6FA",
    bgBottom: "#EFE1EC",
  },
};

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapTitle(title: string): [string, string?] {
  if (title.length <= 16) return [title];
  const words = title.split(" ");
  let line1 = "";
  let line2 = "";
  for (const w of words) {
    if ((line1 + " " + w).trim().length <= 16 || line1 === "") {
      line1 = (line1 + " " + w).trim();
    } else {
      line2 = (line2 + " " + w).trim();
    }
  }
  return line2 ? [line1, line2] : [line1];
}

function renderDietBadge(diet: PackshotSpec["diet"], x: number, y: number): string {
  const isNonVeg = diet === "NON_VEGETARIAN";
  const color = isNonVeg ? "#7A3B1E" : "#1D6A3B";
  return `
    <g transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="18" height="18" rx="2" fill="#FFFDF9" stroke="${color}" stroke-width="1.8"/>
      ${
        isNonVeg
          ? `<polygon points="9,4 14,13.5 4,13.5" fill="${color}"/>`
          : `<circle cx="9" cy="9" r="4.5" fill="${color}"/>`
      }
    </g>
  `;
}

function renderSvg(spec: PackshotSpec): string {
  const pal = COLLECTION_PALETTE[spec.collection];
  const [title1, title2] = wrapTitle(spec.title);
  const subtitleShort =
    spec.subtitle.length > 42 ? spec.subtitle.slice(0, 40) + "..." : spec.subtitle;

  let vesselGroup = "";
  let labelBounds = { x: 190, y: 230, w: 220, h: 245 };

  if (spec.vessel === "amber-bottle") {
    labelBounds = { x: 186, y: 228, w: 228, h: 252 };
    vesselGroup = `
      <ellipse cx="300" cy="542" rx="126" ry="18" fill="#261124" opacity="0.14"/>
      <!-- Ribbed cap -->
      <rect x="218" y="104" width="164" height="52" rx="10" fill="#231021"/>
      <g stroke="#3E233B" stroke-width="2">
        <line x1="234" y1="108" x2="234" y2="152"/>
        <line x1="250" y1="108" x2="250" y2="152"/>
        <line x1="266" y1="108" x2="266" y2="152"/>
        <line x1="282" y1="108" x2="282" y2="152"/>
        <line x1="298" y1="108" x2="298" y2="152"/>
        <line x1="314" y1="108" x2="314" y2="152"/>
        <line x1="330" y1="108" x2="330" y2="152"/>
        <line x1="346" y1="108" x2="346" y2="152"/>
        <line x1="362" y1="108" x2="362" y2="152"/>
      </g>
      <!-- Neck -->
      <rect x="232" y="154" width="136" height="24" fill="#3C1A12"/>
      <!-- Amber glass body -->
      <path d="M232 176 C195 186, 178 206, 178 236 L178 504 C178 526, 194 538, 216 538 L384 538 C406 538, 422 526, 422 504 L422 236 C422 206, 405 186, 368 176 Z" fill="url(#amberGlass)"/>
      <!-- Specular glass highlight -->
      <path d="M196 226 L196 512" stroke="#FFF6EB" stroke-width="8" stroke-linecap="round" opacity="0.22"/>
      <path d="M404 226 L404 512" stroke="#180806" stroke-width="6" stroke-linecap="round" opacity="0.22"/>
    `;
  } else if (spec.vessel === "softgel-flacon") {
    labelBounds = { x: 196, y: 222, w: 208, h: 266 };
    vesselGroup = `
      <ellipse cx="300" cy="546" rx="116" ry="16" fill="#261124" opacity="0.14"/>
      <!-- Satin tall cap -->
      <rect x="232" y="88" width="136" height="62" rx="12" fill="#2B1429"/>
      <rect x="232" y="138" width="136" height="10" fill="#C8432B"/>
      <!-- Flacon body -->
      <path d="M238 150 C206 168, 188 192, 188 224 L188 510 C188 530, 204 542, 224 542 L376 542 C396 542, 412 530, 412 510 L412 224 C412 192, 394 168, 362 150 Z" fill="url(#plumGlass)"/>
      <path d="M204 214 L204 518" stroke="#FFFDF9" stroke-width="7" stroke-linecap="round" opacity="0.24"/>
    `;
  } else if (spec.vessel === "powder-canister") {
    labelBounds = { x: 162, y: 224, w: 276, h: 256 };
    vesselGroup = `
      <ellipse cx="300" cy="544" rx="154" ry="18" fill="#261124" opacity="0.15"/>
      <!-- Wide canister lid -->
      <rect x="156" y="122" width="288" height="44" rx="10" fill="#2B1429"/>
      <rect x="166" y="164" width="268" height="14" fill="#3F213D"/>
      <!-- Matte ivory/stone tub body -->
      <rect x="152" y="176" width="296" height="362" rx="28" fill="url(#tubBody)" stroke="#D9CBB9" stroke-width="2"/>
      <path d="M172 196 L172 518" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" opacity="0.45"/>
    `;
  } else if (spec.vessel === "hydration-tin") {
    labelBounds = { x: 176, y: 204, w: 248, h: 286 };
    vesselGroup = `
      <ellipse cx="300" cy="542" rx="138" ry="16" fill="#261124" opacity="0.14"/>
      <!-- Stick sachets peeking from apothecary caddy -->
      <rect x="208" y="92" width="52" height="90" rx="6" transform="rotate(-6 208 92)" fill="#C8432B"/>
      <rect x="274" y="84" width="52" height="96" rx="6" fill="#2B1429"/>
      <rect x="336" y="94" width="52" height="88" rx="6" transform="rotate(6 336 94)" fill="#EAE1F7" stroke="#C9B6E8"/>
      <!-- Architectural caddy -->
      <rect x="166" y="156" width="268" height="380" rx="18" fill="url(#tubBody)" stroke="#CBBBA7" stroke-width="2"/>
      <rect x="166" y="156" width="268" height="22" rx="8" fill="#2B1429"/>
    `;
  } else {
    labelBounds = { x: 174, y: 274, w: 252, h: 210 };
    vesselGroup = `
      <ellipse cx="300" cy="536" rx="142" ry="17" fill="#261124" opacity="0.16"/>
      <rect x="184" y="196" width="232" height="44" rx="10" fill="#231021"/>
      <rect x="164" y="240" width="272" height="288" rx="34" fill="url(#plumGlass)"/>
      <path d="M184 264 L184 502" stroke="#FFF6EB" stroke-width="7" stroke-linecap="round" opacity="0.2"/>
    `;
  }

  const { x, y, w, h } = labelBounds;
  const holdBanner = spec.reviewHold
    ? `
      <rect x="${x}" y="${y + h - 30}" width="${w}" height="30" rx="4" fill="#734304"/>
      <text x="${x + w / 2}" y="${y + h - 11}" text-anchor="middle" font-family="ui-monospace, monospace" font-size="10.5" font-weight="700" fill="#FDF0D5" letter-spacing="1.2">HOLD · ${esc(spec.reviewHold)}</text>
    `
    : `
      <rect x="${x}" y="${y + h - 28}" width="${w}" height="28" fill="${pal.band}"/>
      <text x="${x + 14}" y="${y + h - 10}" font-family="ui-monospace, monospace" font-size="10" font-weight="600" fill="${pal.bandInk}" letter-spacing="0.8">${esc(spec.netPack.toUpperCase())}</text>
    `;

  const flagshipPill = spec.flagship
    ? `<rect x="36" y="36" width="136" height="28" rx="14" fill="#C8432B"/><text x="104" y="54" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#FFFDF9" letter-spacing="1">FLAGSHIP FORMULA</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 620" role="img" aria-label="${esc(spec.title)} concept packshot (demo only)">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${pal.bgTop}"/>
      <stop offset="100%" stop-color="${pal.bgBottom}"/>
    </linearGradient>
    <radialGradient id="aura" cx="50%" cy="42%" r="48%">
      <stop offset="0%" stop-color="${pal.glow}" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="${pal.glow}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="amberGlass" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#4B2015"/>
      <stop offset="30%" stop-color="#6B301E"/>
      <stop offset="72%" stop-color="#4E2115"/>
      <stop offset="100%" stop-color="#2D110B"/>
    </linearGradient>
    <linearGradient id="plumGlass" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#261124"/>
      <stop offset="35%" stop-color="#452141"/>
      <stop offset="75%" stop-color="#2B1429"/>
      <stop offset="100%" stop-color="#190A18"/>
    </linearGradient>
    <linearGradient id="tubBody" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#F5EFE6"/>
      <stop offset="38%" stop-color="#FFFDF9"/>
      <stop offset="100%" stop-color="#E7DDD0"/>
    </linearGradient>
  </defs>

  <!-- Studio backdrop -->
  <rect width="600" height="620" rx="28" fill="url(#bgGrad)"/>
  <circle cx="300" cy="270" r="240" fill="url(#aura)"/>
  ${flagshipPill}

  <!-- Concept pack disclosure stamp on studio backdrop -->
  <g transform="translate(422, 36)">
    <rect x="0" y="0" width="142" height="28" rx="14" fill="#FFFDF9" stroke="#C7B4A0" stroke-width="1.2"/>
    <text x="71" y="18" text-anchor="middle" font-family="ui-monospace, monospace" font-size="10" font-weight="700" fill="#593C55" letter-spacing="0.9">CONCEPT PACK · DEMO</text>
  </g>

  ${vesselGroup}

  <!-- Wraparound Apothecary Label -->
  <g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#FFFDF9" stroke="#E3D7C8" stroke-width="1.2"/>
    <!-- Top collection colour stripe -->
    <rect x="${x}" y="${y}" width="${w}" height="8" rx="3" fill="${pal.band}"/>

    <!-- Brand header + FSSAI Veg/Non-Veg emblem -->
    <text x="${x + 14}" y="${y + 29}" font-family="Georgia, serif" font-size="14" font-weight="700" fill="#261124" letter-spacing="1.4">GOODFORM</text>
    <text x="${x + 14}" y="${y + 43}" font-family="ui-monospace, monospace" font-size="9" fill="#593C55" letter-spacing="1.1">${esc(spec.collection.toUpperCase())} · ${esc(spec.sku)}</text>
    ${renderDietBadge(spec.diet, x + w - 32, y + 16)}

    <line x1="${x + 14}" y1="${y + 53}" x2="${x + w - 14}" y2="${y + 53}" stroke="#E3D7C8" stroke-width="1"/>

    <!-- Product Display Name -->
    <text x="${x + 14}" y="${y + 80}" font-family="Georgia, serif" font-size="20" font-weight="700" fill="#261124">${esc(title1)}</text>
    ${
      title2
        ? `<text x="${x + 14}" y="${y + 103}" font-family="Georgia, serif" font-size="20" font-weight="700" fill="#261124">${esc(title2)}</text>`
        : ""
    }

    <!-- Subtitle -->
    <text x="${x + 14}" y="${y + (title2 ? 123 : 103)}" font-family="system-ui, sans-serif" font-size="10.5" fill="#593C55">${esc(subtitleShort)}</text>

    <!-- Elemental Dose Pill -->
    <rect x="${x + 14}" y="${y + h - 86}" width="${w - 28}" height="32" rx="6" fill="#F3ECE1" stroke="#DFD2C0"/>
    <text x="${x + 24}" y="${y + h - 66}" font-family="ui-monospace, monospace" font-size="11.5" font-weight="700" fill="#261124">${esc(spec.doseCallout)}</text>

    <!-- Mandatory Front Disclaimer -->
    <text x="${x + 14}" y="${y + h - 38}" font-family="ui-monospace, monospace" font-size="8.5" fill="#593C55" letter-spacing="0.5">HEALTH SUPPLEMENT · DEMO LABEL</text>

    ${holdBanner}
  </g>
</svg>
`;
}

const outDir = path.resolve(process.cwd(), "public/packshots");
fs.mkdirSync(outDir, { recursive: true });

const filterRange = process.argv[2]; // optional "1-14", "15-27", "28-40"
let start = 1;
let end = 40;
if (filterRange && filterRange.includes("-")) {
  const [s, e] = filterRange.split("-").map(Number);
  if (s && e) {
    start = s;
    end = e;
  }
}

let written = 0;
for (const spec of PACKSHOT_SPECS) {
  if (spec.index < start || spec.index > end) continue;
  const svg = renderSvg(spec);
  fs.writeFileSync(path.join(outDir, `${spec.slug}.svg`), svg, "utf8");
  written += 1;
}

console.log(`Generated ${written} packshot SVGs (${start}-${end}) into public/packshots/`);
export {};
