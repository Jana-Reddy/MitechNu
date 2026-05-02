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

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidGoogleDriveUrl(url: string): boolean {
  if (!url) return true; // Optional field
  if (!isValidUrl(url)) return false;
  
  // Check for Google Drive patterns
  const drivePatterns = [
    /drive\.google\.com/,
    /docs\.google\.com/,
    /drive\.usercontent\.google\.com/
  ];
  
  return drivePatterns.some(pattern => pattern.test(url));
}

export function sanitizeHtml(text: string): string {
  // Basic HTML sanitization - remove script tags and event handlers
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
}

export function isValidUpiId(value: string): boolean {
  // UPI ID format: username@upi or phone@upi
  const upiPattern = /^[\w.-]+@[\w.-]+$/;
  return upiPattern.test(value);
}

export function isValidCourseId(value: string): boolean {
  // Accept UUID format OR slug-style IDs (e.g. course_sde, lesson-intro)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const slugIdPattern = /^[a-zA-Z0-9_-]{2,80}$/;
  return uuidPattern.test(value) || slugIdPattern.test(value);
}
