export type PassportBucket = "eu_eea" | "strong" | "mid" | "weak";

const EU_EEA = new Set([
  "Austria","Belgium","Bulgaria","Croatia","Cyprus","Czechia","Denmark","Estonia",
  "Finland","France","Germany","Greece","Hungary","Iceland","Ireland","Italy",
  "Latvia","Liechtenstein","Lithuania","Luxembourg","Malta","Netherlands","Norway",
  "Poland","Portugal","Romania","Slovakia","Slovenia","Spain","Sweden",
]);
const STRONG = new Set([
  "United States","United Kingdom","Canada","Australia","New Zealand","Japan",
  "South Korea","Singapore","Switzerland",
]);

export function passportBucket(country?: string | null): PassportBucket {
  if (!country) return "mid";
  if (EU_EEA.has(country)) return "eu_eea";
  if (STRONG.has(country)) return "strong";
  return "mid";
}
export { EU_EEA };
