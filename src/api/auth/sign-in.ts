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
};

export async function signInUser(input: SignInRequest) {
  // The web API currently sets an HTTP-only cookie. Mobile can test sign-in with
  // this response, but protected mobile calls should eventually use token auth.
  const response = await fetch("https://www.mydocday.com/api/auth/sign-in", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Unable to sign in.");
  }

  return data as SignInResponse;
}
