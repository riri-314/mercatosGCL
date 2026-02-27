import { useMemo } from "react";
import type { ResultsSplit, Cercle, Comitard, Enchere, ComitardWithMeta } from "../../types/results.types";

function isRecordObject(value: unknown): value is Record<string, any> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeEncheres(
  encheres: Comitard["encheres"],
  cercleNameById: Map<string, string>
): Enchere[] {
  // If already an array (rare but possible), just return a sorted copy
  if (Array.isArray(encheres)) {
    return [...encheres].sort((a, b) => a.date.toMillis() - b.date.toMillis());
  }

  // If it's an object keyed by enchereID, convert to array
  if (isRecordObject(encheres)) {
    const arr: Enchere[] = Object.keys(encheres).map((enchereID) => {
      const e = encheres[enchereID] as Enchere;

      return {
        date: e.date,
        // in DB, sender is (apparently) cercleID -> map to cercle name
        sender: cercleNameById.get((e as any).sender) ?? "",
        vote: (e as any).vote ?? 0,
      };
    });

    return arr.sort((a, b) => a.date.toMillis() - b.date.toMillis());
  }

  return [];
}

export function useComitardResults(rawDoc: any): ResultsSplit {
  return useMemo(() => {
    const running: ComitardWithMeta[] = [];
    const closed: ComitardWithMeta[] = [];

    const cerclesData = rawDoc?.data?.()?.cercles ?? rawDoc?.data()?.cercles;
    if (!isRecordObject(cerclesData)) return { running, closed };

    // Build cercle lookup
    const cercleNameById = new Map<string, string>();
    const cercles: Cercle[] = [];

    for (const cercleID of Object.keys(cerclesData)) {
      const c = cerclesData[cercleID];
      const cercle: Cercle = {
        name: c?.name ?? "",
        description: c?.description ?? "",
        nbFut: c?.nbFut ?? 0,
        comitards: Object.values(c?.comitards ?? {}) as Comitard[],
        admins: c?.admins,
      };

      cercleNameById.set(cercleID, cercle.name);
      cercles.push(cercle);
    }

    const now = Date.now();

    for (const cercle of cercles) {
      for (const comitard of cercle.comitards) {
        if (!comitard?.enchereStop) continue;

        const normalizedEncheres = normalizeEncheres(comitard.encheres, cercleNameById);

        const normalized: ComitardWithMeta = {
          ...comitard,
          cercle: cercle.name,
          encheres: normalizedEncheres,
        };

        if (comitard.enchereStop.toMillis() > now) running.push(normalized);
        else closed.push(normalized);
      }
    }

    running.sort(
      (a, b) => (a.enchereStop?.toMillis() ?? Number.POSITIVE_INFINITY) - (b.enchereStop?.toMillis() ?? Number.POSITIVE_INFINITY)
    );
    closed.sort(
      (a, b) => (b.enchereStop?.toMillis() ?? Number.POSITIVE_INFINITY) - (a.enchereStop?.toMillis() ?? Number.POSITIVE_INFINITY)
    );

    return { running, closed };
  }, [rawDoc]);
}

export function formatTimeLeft(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}