export type SignInRequest = {
  email: string;
  password: string;
};

export type SignedInUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  city: string;
  state: string;
  profileImageUrl: string | null;
  isActive: boolean;
  onboarding: {
    currentStep: number;
    completedSteps: number[];
    isComplete: boolean;
  };
};

type SignInResponse = {
  message: string;
  user: SignedInUser;
  session: {
    token: string;
    expiresAt: string;
  };
};

export async function signInUser(input: SignInRequest) {
  // Mobile uses the returned session token. Web still uses the HTTP-only cookie.
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/auth/sign-in`,
    {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Unable to sign in.");
  }

  return data as SignInResponse;
}
