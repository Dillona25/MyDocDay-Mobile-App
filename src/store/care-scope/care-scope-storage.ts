/*
 * Persists the selected care scope separately for each signed-in account.
 */

import * as SecureStore from "expo-secure-store";
import type { CareScope } from "./CareScopeContext";

const careScopeKeyPrefix = "mydocday_care_scope";

// Saves the account's current family filter between app launches.
export async function saveCareScope(userId: number, scope: CareScope) {
  await SecureStore.setItemAsync(
    `${careScopeKeyPrefix}_${userId}`,
    JSON.stringify(scope),
  );
}

// Loads a valid saved scope or falls back to the complete family view.
export async function getCareScope(userId: number): Promise<CareScope> {
  const storedValue = await SecureStore.getItemAsync(
    `${careScopeKeyPrefix}_${userId}`,
  );

  if (!storedValue) {
    return { type: "all" };
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    if (isCareScope(parsedValue)) {
      return parsedValue;
    }
  } catch {
    // Invalid local preferences safely fall back to the complete family view.
  }

  return { type: "all" };
}

// Prevents malformed local storage from entering the shared scope state.
function isCareScope(value: unknown): value is CareScope {
  if (!value || typeof value !== "object" || !("type" in value)) {
    return false;
  }

  if (value.type === "all" || value.type === "self") {
    return true;
  }

  return (
    value.type === "member" &&
    "careMemberId" in value &&
    typeof value.careMemberId === "number" &&
    Number.isInteger(value.careMemberId) &&
    value.careMemberId > 0
  );
}
