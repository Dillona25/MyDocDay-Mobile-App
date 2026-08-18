import type { CareTask } from "@/types/care-task";

const millisecondsPerDay = 24 * 60 * 60 * 1000;

export function getDaysUntilDue(dueDate: string) {
  const [year, month, day] = dueDate.slice(0, 10).split("-").map(Number);
  const today = new Date();
  const todayUtc = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  return Math.round(
    (Date.UTC(year, month - 1, day) - todayUtc) / millisecondsPerDay,
  );
}

export function getDuePresentation(dueDate: string) {
  const daysUntilDue = getDaysUntilDue(dueDate);

  if (daysUntilDue < 0) {
    const overdueDays = Math.abs(daysUntilDue);

    return {
      label: `${overdueDays} ${overdueDays === 1 ? "day" : "days"} overdue`,
      tone: "urgent" as const,
    };
  }

  if (daysUntilDue === 0) {
    return { label: "Due today", tone: "urgent" as const };
  }

  if (daysUntilDue <= 2) {
    return {
      label: `In ${daysUntilDue} ${daysUntilDue === 1 ? "day" : "days"}`,
      tone: "urgent" as const,
    };
  }

  if (daysUntilDue < 4) {
    return { label: `In ${daysUntilDue} days`, tone: "warning" as const };
  }

  return { label: `In ${daysUntilDue} days`, tone: "safe" as const };
}

export function getTaskSortValue(task: CareTask) {
  return `${task.dueDate}T${task.dueTime ?? "23:59"}`;
}

export function formatTaskTime(dueTime: string | null) {
  if (!dueTime) {
    return undefined;
  }

  const [hours, minutes] = dueTime.split(":").map(Number);

  return `Due at ${new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2000, 0, 1, hours, minutes))}`;
}
