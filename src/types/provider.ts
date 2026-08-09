export type ProviderType = "provider" | "clinic";

export type Provider = {
  id: number;
  userId: number;
  firstName: string | null;
  lastName: string | null;
  clinicName: string | null;
  specialty: string;
  type: ProviderType | "";
  phoneNumber: string | null;
  imageUrl: string | null;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GetProvidersResponse = {
  message: string;
  providers: Provider[];
};

export type CreateProviderInput = {
  userId: number;
  firstName?: string;
  lastName?: string;
  clinicName?: string;
  specialty: string;
  type: ProviderType;
  phoneNumber?: string;
  imageUrl?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
};

export type UpdateProviderInput = Omit<CreateProviderInput, "userId"> & {
  providerId: number;
};
