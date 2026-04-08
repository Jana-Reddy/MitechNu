const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidEmail(value: string) {
  return emailPattern.test(value);
}

export function isValidSlug(value: string) {
  return slugPattern.test(value);
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeSlug(value: string) {
  return value.trim().toLowerCase();
}

export function cleanText(value: FormDataEntryValue | null | undefined) {
  return String(value ?? "").trim();
}

export function cleanOptionalText(value: FormDataEntryValue | null | undefined) {
  const cleaned = cleanText(value);
  return cleaned || undefined;
}

export function parsePositiveNumber(value: FormDataEntryValue | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function parseNonNegativeNumber(value: FormDataEntryValue | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
