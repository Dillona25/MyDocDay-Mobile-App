import type {
  CreateProviderInput,
  GetProvidersResponse,
  Provider,
} from "@/types/provider";

export async function getUserProviders(
  token: string,
): Promise<GetProvidersResponse> {
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/providers`, {
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

type CreateProviderRequest = Omit<CreateProviderInput, "userId">;
type CreateProviderResponse = {
  message: string;
  provider: Provider;
};

export async function createProvider(
  providerData: CreateProviderRequest,
  token: string,
): Promise<CreateProviderResponse> {
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/providers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(providerData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Unable to create provider");
  }

  return data;
}

type DeleteProviderResponse = {
  message: string;
};

export async function deleteProvider(
  providerId: number,
  token: string,
): Promise<DeleteProviderResponse> {
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/providers`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ providerId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Unable to delete provider");
  }

  return data;
}
