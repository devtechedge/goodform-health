import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#FCF8F2",
          color: "#261124",
          padding: "64px 76px",
          fontFamily: "Georgia, serif",
          border: "16px solid #2B1429",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "16px",
                backgroundColor: "#2B1429",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FCF8F2",
                fontSize: "26px",
                fontWeight: 700,
              }}
            >
              G
            </div>
            <span style={{ fontSize: "38px", fontWeight: 700, letterSpacing: "2px" }}>
              GOODFORM
            </span>
          </div>
          <div
            style={{
              backgroundColor: "#EAE1F7",
              color: "#4E3278",
              padding: "10px 22px",
              borderRadius: "999px",
              fontSize: "20px",
              fontFamily: "sans-serif",
              fontWeight: 600,
            }}
          >
            Modern Indian Apothecary · INR
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ fontSize: "74px", fontWeight: 700, lineHeight: 1.06 }}>
            {BRAND.tagline}
          </div>
          <div
            style={{
              fontSize: "28px",
              color: "#593C55",
              fontFamily: "sans-serif",
              maxWidth: "960px",
              lineHeight: 1.35,
            }}
          >
            Single-brand daily supplements with full elemental dosing, Routine Builder overlap checks, and India FSSAI publishing gates.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "2px solid #E3D7C8",
            paddingTop: "24px",
            fontSize: "20px",
            fontFamily: "monospace",
            color: "#992C19",
          }}
        >
          <span>40 Seeded Formulations · 32 Published · 8 FSSAI-Gated</span>
          <span>NOT FOR MEDICINAL USE</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
