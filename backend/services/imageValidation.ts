import { HttpError } from "./validation";

const campusPhotos = new Set([
  "995436323902947317.jpg", "Tower of  light.jpg", "TW Khambule building @Wits University.jpg",
  "Wits CLM building.jpg", "wits library.jpg", "Wits university (1).jpg",
  "Wits university fountain.jpg", "wits university.jpg", "Wits.jpg", "🤍.jpg",
].map(name => `/wits%20pictures/${encodeURIComponent(name)}`));

export function imageValue(value: unknown, allowCampus = false): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || value.length > 180000) throw new HttpError(400, "Choose an image smaller than 130 KB after resizing.");
  if (allowCampus && campusPhotos.has(value)) return value;
  if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) throw new HttpError(400, "Upload a JPEG, PNG or WebP photo using the image picker.");
  const bytes = Buffer.from(value.slice(value.indexOf(",") + 1), "base64");
  if (bytes.length < 4 || bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255 || bytes[bytes.length - 2] !== 255 || bytes[bytes.length - 1] !== 217) {
    throw new HttpError(400, "Invalid photo data.");
  }
  return value;
}
