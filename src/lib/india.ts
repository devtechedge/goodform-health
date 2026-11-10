export interface IndianStateInfo {
  code: string;
  name: string;
  gstStateCode: string;
  isUnionTerritory?: boolean;
}

export const INDIAN_STATES: readonly IndianStateInfo[] = [
  { code: "AN", name: "Andaman and Nicobar Islands", gstStateCode: "35", isUnionTerritory: true },
  { code: "AP", name: "Andhra Pradesh", gstStateCode: "37" },
  { code: "AR", name: "Arunachal Pradesh", gstStateCode: "12" },
  { code: "AS", name: "Assam", gstStateCode: "18" },
  { code: "BR", name: "Bihar", gstStateCode: "10" },
  { code: "CH", name: "Chandigarh", gstStateCode: "04", isUnionTerritory: true },
  { code: "CG", name: "Chhattisgarh", gstStateCode: "22" },
  { code: "DN", name: "Dadra and Nagar Haveli and Daman and Diu", gstStateCode: "26", isUnionTerritory: true },
  { code: "DL", name: "Delhi", gstStateCode: "07", isUnionTerritory: true },
  { code: "GA", name: "Goa", gstStateCode: "30" },
  { code: "GJ", name: "Gujarat", gstStateCode: "24" },
  { code: "HR", name: "Haryana", gstStateCode: "06" },
  { code: "HP", name: "Himachal Pradesh", gstStateCode: "02" },
  { code: "JK", name: "Jammu and Kashmir", gstStateCode: "01", isUnionTerritory: true },
  { code: "JH", name: "Jharkhand", gstStateCode: "20" },
  { code: "KA", name: "Karnataka", gstStateCode: "29" },
  { code: "KL", name: "Kerala", gstStateCode: "32" },
  { code: "LA", name: "Ladakh", gstStateCode: "38", isUnionTerritory: true },
  { code: "LD", name: "Lakshadweep", gstStateCode: "31", isUnionTerritory: true },
  { code: "MP", name: "Madhya Pradesh", gstStateCode: "23" },
  { code: "MH", name: "Maharashtra", gstStateCode: "27" },
  { code: "MN", name: "Manipur", gstStateCode: "14" },
  { code: "ML", name: "Meghalaya", gstStateCode: "17" },
  { code: "MZ", name: "Mizoram", gstStateCode: "15" },
  { code: "NL", name: "Nagaland", gstStateCode: "13" },
  { code: "OD", name: "Odisha", gstStateCode: "21" },
  { code: "PY", name: "Puducherry", gstStateCode: "34", isUnionTerritory: true },
  { code: "PB", name: "Punjab", gstStateCode: "03" },
  { code: "RJ", name: "Rajasthan", gstStateCode: "08" },
  { code: "SK", name: "Sikkim", gstStateCode: "11" },
  { code: "TN", name: "Tamil Nadu", gstStateCode: "33" },
  { code: "TS", name: "Telangana", gstStateCode: "36" },
  { code: "TR", name: "Tripura", gstStateCode: "16" },
  { code: "UP", name: "Uttar Pradesh", gstStateCode: "09" },
  { code: "UK", name: "Uttarakhand", gstStateCode: "05" },
  { code: "WB", name: "West Bengal", gstStateCode: "19" },
] as const;

export const INDIAN_STATE_CODES = INDIAN_STATES.map((s) => s.code) as [
  string,
  ...string[],
];

export const INDIA_PIN_REGEX = /^[1-9][0-9]{5}$/;
export const INDIA_MOBILE_REGEX = /^(?:\+91[\s-]?)?[6-9][0-9]{9}$/;

export function isValidIndianPin(pin: string): boolean {
  return INDIA_PIN_REGEX.test(pin.trim());
}

export function getStateByCode(code: string): IndianStateInfo | undefined {
  const upper = code.trim().toUpperCase();
  return INDIAN_STATES.find((s) => s.code === upper);
}

export function inferStateFromPin(pin: string): string | null {
  const clean = pin.trim();
  if (!isValidIndianPin(clean)) return null;
  const p2 = Number(clean.slice(0, 2));
  if (p2 === 11) return "DL";
  if (p2 >= 12 && p2 <= 13) return "HR";
  if (p2 >= 14 && p2 <= 16) return "PB";
  if (p2 === 17) return "HP";
  if (p2 >= 18 && p2 <= 19) return "JK";
  if (p2 >= 20 && p2 <= 28) return "UP";
  if (p2 >= 30 && p2 <= 34) return "RJ";
  if (p2 >= 36 && p2 <= 39) return "GJ";
  if (p2 >= 40 && p2 <= 44) return "MH";
  if (p2 >= 45 && p2 <= 48) return "MP";
  if (p2 === 49) return "CG";
  if (p2 >= 50 && p2 <= 50) return "TS";
  if (p2 >= 51 && p2 <= 53) return "AP";
  if (p2 >= 56 && p2 <= 59) return "KA";
  if (p2 >= 60 && p2 <= 64) return "TN";
  if (p2 >= 67 && p2 <= 69) return "KL";
  if (p2 >= 70 && p2 <= 74) return "WB";
  if (p2 >= 75 && p2 <= 77) return "OD";
  if (p2 === 78) return "AS";
  if (p2 >= 80 && p2 <= 85) return "BR";
  return null;
}

const inrWholeFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const inrFractionalFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats integer INR paise (100 paise = INR 1.00) safely with Indian lakh/thousand grouping.
 */
export function formatInrPaise(
  paise: number,
  options?: { alwaysShowPaise?: boolean },
): string {
  if (!Number.isFinite(paise)) {
    throw new Error("Invalid paise value");
  }
  const roundedPaise = Math.round(paise);
  const rupees = roundedPaise / 100;
  if (!options?.alwaysShowPaise && roundedPaise % 100 === 0) {
    return inrWholeFormatter.format(rupees);
  }
  return inrFractionalFormatter.format(rupees);
}
