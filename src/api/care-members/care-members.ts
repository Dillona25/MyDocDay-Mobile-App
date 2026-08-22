import type {
  CareMember,
  CreateCareMemberInput,
  GetCareMembersResponse,
  UpdateCareMemberInput,
} from "@/types/care-member";

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

type CareMemberResponse = {
  message: string;
  careMember: CareMember;
};

type MessageResponse = {
  message: string;
};

type AvatarResponse = MessageResponse & {
  profileImageUrl: string;
};

export class CareMemberApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "CareMemberApiError";
  }
}

export async function getCareMembers(
  token: string,
): Promise<GetCareMembersResponse> {
  const data = await request("/api/care-members", token, { method: "GET" });

  if (!isGetCareMembersResponse(data)) {
    throw new CareMemberApiError(
      "The family API returned an invalid response.",
      502,
      "INVALID_CARE_MEMBER_RESPONSE",
    );
  }

  return data;
}

export async function createCareMember(
  input: CreateCareMemberInput,
  token: string,
): Promise<CareMemberResponse> {
  const data = await request("/api/care-members", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!isCareMemberResponse(data)) {
    throw new CareMemberApiError(
      "The family API returned an invalid create response.",
      502,
      "INVALID_CARE_MEMBER_RESPONSE",
    );
  }

  return data;
}

export async function updateCareMember(
  input: UpdateCareMemberInput,
  token: string,
): Promise<CareMemberResponse> {
  const data = await request("/api/care-members", token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!isCareMemberResponse(data)) {
    throw new CareMemberApiError(
      "The family API returned an invalid update response.",
      502,
      "INVALID_CARE_MEMBER_RESPONSE",
    );
  }

  return data;
}

export async function archiveCareMember(
  careMemberId: number,
  token: string,
): Promise<MessageResponse> {
  const data = await request("/api/care-members", token, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ careMemberId }),
  });

  if (!isRecord(data) || typeof data.message !== "string") {
    throw new CareMemberApiError(
      "The family API returned an invalid delete response.",
      502,
      "INVALID_CARE_MEMBER_RESPONSE",
    );
  }

  return { message: data.message };
}

export async function uploadCareMemberAvatar(
  careMemberId: number,
  imageUri: string,
  token: string,
): Promise<AvatarResponse> {
  const formData = new FormData();
  formData.append("avatar", {
    uri: imageUri,
    name: "family-member.jpg",
    type: "image/jpeg",
  } as unknown as Blob);

  const data = await request(
    `/api/care-members/${careMemberId}/avatar`,
    token,
    { method: "POST", body: formData },
  );

  if (
    !isRecord(data) ||
    typeof data.message !== "string" ||
    typeof data.profileImageUrl !== "string"
  ) {
    throw new CareMemberApiError(
      "The family API returned an invalid image response.",
      502,
      "INVALID_CARE_MEMBER_RESPONSE",
    );
  }

  return {
    message: data.message,
    profileImageUrl: data.profileImageUrl,
  };
}

export async function deleteCareMemberAvatar(
  careMemberId: number,
  token: string,
): Promise<MessageResponse> {
  const data = await request(
    `/api/care-members/${careMemberId}/avatar`,
    token,
    { method: "DELETE" },
  );

  if (!isRecord(data) || typeof data.message !== "string") {
    throw new CareMemberApiError(
      "The family API returned an invalid image response.",
      502,
      "INVALID_CARE_MEMBER_RESPONSE",
    );
  }

  return { message: data.message };
}

export function getCareMemberImageSource(
  profileImageUrl: string | null | undefined,
  token: string | null,
) {
  if (!profileImageUrl || !token) return null;

  return {
    uri: profileImageUrl.startsWith("http")
      ? profileImageUrl
      : `${getApiBaseUrl()}${profileImageUrl}`,
    headers: { Authorization: `Bearer ${token}` },
  };
}

async function request(
  path: string,
  token: string,
  init: RequestInit,
): Promise<unknown> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new CareMemberApiError(
      `The family API returned an invalid response (${response.status}).`,
      response.status,
      "INVALID_API_RESPONSE",
    );
  }

  const data: unknown = await response.json();

  if (!response.ok) {
    const error = isRecord(data) ? data : {};
    const validationMessage = isRecord(error.errors)
      ? Object.values(error.errors)
          .flatMap((messages) => (Array.isArray(messages) ? messages : []))
          .find((message): message is string => typeof message === "string")
      : undefined;

    throw new CareMemberApiError(
      validationMessage ??
        (typeof error.message === "string"
          ? error.message
          : "Unable to update your family."),
      response.status,
      typeof error.code === "string" ? error.code : undefined,
    );
  }

  return data;
}

function getApiBaseUrl(): string {
  if (!apiBaseUrl) {
    throw new CareMemberApiError(
      "The mobile API URL is not configured.",
      0,
      "API_URL_NOT_CONFIGURED",
    );
  }

  return apiBaseUrl;
}

function isGetCareMembersResponse(
  value: unknown,
): value is GetCareMembersResponse {
  return (
    isRecord(value) &&
    typeof value.message === "string" &&
    Array.isArray(value.careMembers) &&
    value.careMembers.every(isCareMember)
  );
}

function isCareMemberResponse(value: unknown): value is CareMemberResponse {
  return (
    isRecord(value) &&
    typeof value.message === "string" &&
    isCareMember(value.careMember)
  );
}

function isCareMember(value: unknown): value is CareMember {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.userId === "number" &&
    typeof value.firstName === "string" &&
    (value.lastName === null || typeof value.lastName === "string") &&
    typeof value.relationship === "string" &&
    (value.profileImageUrl === null ||
      typeof value.profileImageUrl === "string") &&
    typeof value.isActive === "boolean"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
