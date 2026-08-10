import type { SignedInUser } from "@/api/auth/sign-in";

export type UpdateUserProfileInput = {
  firstName: string;
  lastName: string;
  city: string;
  state: string;
};

type UserProfileResponse = {
  message: string;
  user: SignedInUser;
};

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

export async function updateUserProfile(
  input: UpdateUserProfileInput,
  token: string,
) {
  const response = await fetch(`${apiBaseUrl}/api/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, "Unable to update your profile."));
  }

  return data as UserProfileResponse;
}

export async function uploadUserProfileImage(imageUri: string, token: string) {
  const formData = new FormData();
  formData.append("avatar", {
    uri: imageUri,
    name: "profile.jpg",
    type: "image/jpeg",
  } as unknown as Blob);

  const response = await fetch(`${apiBaseUrl}/api/users/me/avatar`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(data, "Unable to upload your profile image."),
    );
  }

  return data as UserProfileResponse;
}

export async function deleteUserProfileImage(token: string) {
  const response = await fetch(`${apiBaseUrl}/api/users/me/avatar`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(data, "Unable to remove your profile image."),
    );
  }

  return data as UserProfileResponse;
}

export function getUserProfileImageSource(
  profileImageUrl: string | null | undefined,
  token: string | null,
) {
  if (!profileImageUrl || !token) {
    return null;
  }

  const uri = profileImageUrl.startsWith("http")
    ? profileImageUrl
    : `${apiBaseUrl}${profileImageUrl}`;

  return {
    uri,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

function getApiErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const responseData = data as {
    message?: string;
    errors?: Record<string, string[]>;
  };
  const validationMessage = Object.values(responseData.errors ?? {})
    .flat()
    .find(Boolean);

  return validationMessage ?? responseData.message ?? fallback;
}
