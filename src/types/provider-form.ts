import type { ProviderType } from "./provider";

export type ProviderFormData = {
  firstName: string;
  lastName: string;
  clinicName: string;
  specialty: string;
  phoneNumber: string;
  type: ProviderType | "";
  imageUrl: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
};
