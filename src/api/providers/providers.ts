import type {
  CreateProviderInput,
  GetProvidersResponse,
  Provider,
  UpdateProviderInput,
} from "@/types/provider";

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

export class ProviderApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ProviderApiError";
  }
}

export async function getUserProviders(
  token: string,
): Promise<GetProvidersResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/providers`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data: unknown = await readJsonResponse(response);

  if (!response.ok) {
    throwApiError(data, response.status, "Unable to load providers.");
  }

  if (!isGetProvidersResponse(data)) {
    throw new ProviderApiError(
      "The provider response is missing required mobile fields. Update the deployed API and try again.",
      502,
      "INVALID_PROVIDER_RESPONSE",
    );
  }

  return data;
}

type CreateProviderResponse = {
  message: string;
  provider: Provider;
};

export async function createProvider(
  providerData: CreateProviderInput,
  token: string,
): Promise<CreateProviderResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/providers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(providerData),
  });

  const data: unknown = await readJsonResponse(response);

  if (!response.ok) {
    throwApiError(data, response.status, "Unable to create provider.");
  }

  if (!isProviderMutationResponse(data)) {
    throw new ProviderApiError(
      "The provider API returned an invalid create response.",
      502,
      "INVALID_PROVIDER_RESPONSE",
    );
  }

  return data;
}

type UpdateProviderResponse = {
  message: string;
  provider: Provider;
};

export async function updateProvider(
  providerData: UpdateProviderInput,
  token: string,
): Promise<UpdateProviderResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/providers`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(providerData),
  });

  const data: unknown = await readJsonResponse(response);

  if (!response.ok) {
    throwApiError(data, response.status, "Unable to update provider.");
  }

  if (!isProviderMutationResponse(data)) {
    throw new ProviderApiError(
      "The provider API returned an invalid update response.",
      502,
      "INVALID_PROVIDER_RESPONSE",
    );
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
  const response = await fetch(`${getApiBaseUrl()}/api/providers`, {
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

function getApiBaseUrl(): string {
  if (!apiBaseUrl) {
    throw new ProviderApiError(
      "The mobile API URL is not configured.",
      0,
      "API_URL_NOT_CONFIGURED",
    );
  }

  return apiBaseUrl;
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new ProviderApiError(
      `The provider API returned an invalid response (${response.status}).`,
      response.status,
      "INVALID_API_RESPONSE",
    );
  }

  return response.json();
}

function throwApiError(
  data: unknown,
  statusCode: number,
  fallbackMessage: string,
): never {
  const error = isRecord(data) ? data : {};
  const message =
    typeof error.message === "string" ? error.message : fallbackMessage;
  const code = typeof error.code === "string" ? error.code : undefined;

  throw new ProviderApiError(message, statusCode, code);
}

function isGetProvidersResponse(value: unknown): value is GetProvidersResponse {
  if (!isRecord(value) || !Array.isArray(value.providers)) return false;

  return value.providers.every(
    (provider) =>
      isRecord(provider) &&
      typeof provider.id === "number" &&
      typeof provider.userId === "number" &&
      (provider.type === "provider" || provider.type === "clinic") &&
      typeof provider.specialty === "string" &&
      typeof provider.isForAccountOwner === "boolean" &&
      Array.isArray(provider.careMembers) &&
      Array.isArray(provider.visitSchedules) &&
      (provider.visitSchedule === null || isRecord(provider.visitSchedule)),
  );
}

function isProviderMutationResponse(
  value: unknown,
): value is CreateProviderResponse | UpdateProviderResponse {
  return (
    isRecord(value) &&
    typeof value.message === "string" &&
    isProvider(value.provider)
  );
}

function isProvider(value: unknown): value is Provider {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.userId === "number" &&
    (value.type === "provider" || value.type === "clinic") &&
    typeof value.specialty === "string" &&
    typeof value.isForAccountOwner === "boolean" &&
    Array.isArray(value.careMembers) &&
    Array.isArray(value.visitSchedules) &&
    (value.visitSchedule === null || isRecord(value.visitSchedule))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
