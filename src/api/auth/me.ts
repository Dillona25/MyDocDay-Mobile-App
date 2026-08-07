import type { SignedInUser } from "@/api/auth/sign-in";

type CurrentUserResponse = {
  message: string;
  user: SignedInUser;
};

export async function getCurrentUser(token: string) {
  const response = await fetch("https://www.mydocday.com/api/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Unable to load your session.");
  }

  return data as CurrentUserResponse;
}
