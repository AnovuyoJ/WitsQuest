export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function id(value: unknown): string {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new HttpError(400, "A valid UUID is required.");
  }
  return value;
}

export function text(value: unknown, field: string, max = 2000): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) {
    throw new HttpError(400, `${field} is required (maximum ${max} characters).`);
  }
  return value.trim();
}

export function number(value: unknown, field: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw new HttpError(400, `${field} must be between ${min} and ${max}.`);
  }
  return value;
}

export function optionalText(value: unknown, field: string): string | null {
  return value === null || value === undefined || value === "" ? null : text(value, field);
}
