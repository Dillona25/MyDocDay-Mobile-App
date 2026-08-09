import * as SecureStore from "expo-secure-store";

const sessionTokenKey = "mydocday_session_token";

export async function saveSessionToken(token: string) {
  await SecureStore.setItemAsync(sessionTokenKey, token);
}

export async function getSessionToken() {
  return SecureStore.getItemAsync(sessionTokenKey);
}

export async function deleteSessionToken() {
  await SecureStore.deleteItemAsync(sessionTokenKey);
}
