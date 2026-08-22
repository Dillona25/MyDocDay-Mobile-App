export type CareMember = {
  id: number;
  userId: number;
  firstName: string;
  lastName: string | null;
  relationship: string;
  profileImageUrl: string | null;
  isActive: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCareMemberInput = {
  firstName: string;
  lastName?: string;
  relationship: string;
};

export type UpdateCareMemberInput = CreateCareMemberInput & {
  careMemberId: number;
};

export type GetCareMembersResponse = {
  message: string;
  careMembers: CareMember[];
};

export type CareMemberFormData = {
  firstName: string;
  lastName: string;
  relationship: string;
};

export type CareMemberFormSubmission = {
  input: CreateCareMemberInput;
  selectedImageUri: string | null;
  shouldRemoveImage: boolean;
};
