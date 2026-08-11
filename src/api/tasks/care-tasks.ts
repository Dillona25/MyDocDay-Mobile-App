import type {
  CreateCareTaskInput,
  CreateCareTaskResponse,
  GetCareTasksResponse,
  UpdateCareTaskInput,
  UpdateCareTaskResponse,
} from "@/types/care-task";

export async function getCareTasks(
  token: string,
): Promise<GetCareTasksResponse> {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/tasks`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Unable to load care tasks");
  }

  return data;
}

export async function updateCareTask(
  taskData: UpdateCareTaskInput,
  token: string,
): Promise<UpdateCareTaskResponse> {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/tasks`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(taskData),
    },
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Unable to update health reminder");
  }

  return data;
}

export async function deleteCareTask(
  taskId: number,
  token: string,
): Promise<{ message: string }> {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/tasks`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ taskId }),
    },
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Unable to delete health reminder");
  }

  return data;
}

export async function createCareTask(
  taskData: CreateCareTaskInput,
  token: string,
): Promise<CreateCareTaskResponse> {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/tasks`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(taskData),
    },
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Unable to create care task");
  }

  return data;
}
