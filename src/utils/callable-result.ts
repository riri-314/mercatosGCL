export function requireMutationSuccess(data: unknown): void {
  const result = data && typeof data === "object"
    ? data as { success?: unknown; message?: unknown }
    : null;
  if (result?.success !== true) {
    throw new Error(typeof result?.message === "string"
      ? result.message
      : "L'opération n'a pas été confirmée. Veuillez réessayer.");
  }
}
