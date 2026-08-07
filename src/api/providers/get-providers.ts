import type { GetProvidersResponse } from "@/types/provider";

export async function getUserProviders(
  token: string,
): Promise<GetProvidersResponse> {
  const response = await fetch("https://www.mydocday.com/api/providers", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Unable to load providers");
  }

  return data;
}
