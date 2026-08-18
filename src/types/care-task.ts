import type { ProviderType } from "./provider";

export type CareTaskStatus = "pending" | "completed";

export type CareTask = {
  id: number;
  userId: number;
  providerId: number | null;
  providerName: string | null;
  providerType: ProviderType | null;
  title: string;
  notes: string | null;
  dueDate: string;
  dueTime: string | null;
  status: CareTaskStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GetCareTasksResponse = {
  message: string;
  tasks: CareTask[];
};

export type CreateCareTaskInput = {
  providerId?: number;
  title: string;
  notes?: string;
  dueDate: string;
  dueTime?: string;
};

export type CreateCareTaskResponse = {
  message: string;
  task: CareTask;
};

export type UpdateCareTaskInput = CreateCareTaskInput & {
  taskId: number;
  status: CareTaskStatus;
};

export type UpdateCareTaskResponse = CreateCareTaskResponse;
