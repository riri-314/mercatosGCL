import { HttpsError } from "firebase-functions/v2/https";

const textLimits = {
  name: 30, firstname: 30, nickname: 30, post: 30,
  etatCivil: 150, pointFort: 150, pointFaible: 150, estLeSeul: 150,
  picture: 2048, pictureThumbnail: 2048,
};
const numberLimits = { teneurTaule: 10, age: 99, nbEtoiles: 15, campus: 4 };
const profileFields = [...Object.keys(textLimits), ...Object.keys(numberLimits)];

function invalid(field: string): never {
  throw new HttpsError("invalid-argument", `Invalid ${field}`);
}

function payload(value: unknown, allowed: string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid("payload");
  if (Object.keys(value).some((key) => !allowed.includes(key))) invalid("payload field");
  return value as Record<string, unknown>;
}

export function identifier(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(value) ||
      ["__proto__", "constructor", "prototype"].includes(value)) invalid(field);
  return value;
}

export function parseVote(value: unknown) {
  const data = payload(value, ["editionId", "comitardId", "vote", "clientTime"]);
  const editionId = identifier(data.editionId, "editionId");
  const comitardId = identifier(data.comitardId, "comitardId");
  if (typeof data.vote !== "number" || !Number.isSafeInteger(data.vote) || data.vote <= 0) {
    invalid("vote");
  }
  if (typeof data.clientTime !== "string" || data.clientTime.length > 64 ||
      !Number.isFinite(Date.parse(data.clientTime))) invalid("clientTime");
  return { editionId, comitardId, vote: data.vote, clientTime: data.clientTime };
}

export function parseProfile(value: unknown, editing: boolean) {
  // `cercle` is the legacy display label on edit requests, but the selected
  // circle's ID on create requests. It is never a writable profile field.
  const data = payload(value, ["editionId", "cercle", ...profileFields,
    ...(editing ? ["comitardId", "cercleId"] : [])]);
  const editionId = identifier(data.editionId, "editionId");
  const comitardId = editing ? identifier(data.comitardId, "comitardId") : undefined;
  let cercleId: string | undefined;
  if (editing && data.cercleId != null) cercleId = identifier(data.cercleId, "cercleId");
  if (!editing && data.cercle != null) cercleId = identifier(data.cercle, "cercle");
  if (editing && data.cercle != null &&
      (typeof data.cercle !== "string" || data.cercle.length > 150)) invalid("cercle");

  const profile: Record<string, string | number> = {};
  for (const [key, limit] of Object.entries(textLimits)) {
    if ((editing || key === "pictureThumbnail") && !Object.prototype.hasOwnProperty.call(data, key)) continue;
    const value = data[key];
    if (typeof value !== "string" || !value.trim() || value.length > limit) invalid(key);
    if (key === "picture" || key === "pictureThumbnail") {
      try {
        const url = new URL(value, "https://profile.invalid");
        if (!["https:", "http:"].includes(url.protocol) ||
            (url.origin === "https://profile.invalid" && !value.startsWith("/assets/"))) invalid(key);
      } catch {
        invalid(key);
      }
    }
    profile[key] = value;
  }
  for (const [key, limit] of Object.entries(numberLimits)) {
    if (editing && !Object.prototype.hasOwnProperty.call(data, key)) continue;
    const value = data[key];
    if (typeof value !== "number" || !Number.isSafeInteger(value) ||
        value < (key === "campus" ? 1 : 0) || value > limit) invalid(key);
    profile[key] = value;
  }
  if (!Object.keys(profile).length) invalid("empty profile update");
  return { editionId, comitardId, cercleId, profile };
}
