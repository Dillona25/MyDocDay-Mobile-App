import { HapticButton } from "@/components/common/HapticButton";
import { CareTaskCard } from "@/components/reminders/care-task-card";
import { ReminderAlert } from "@/components/reminders/reminder-alert";
import { useCareTasks } from "@/hooks/useCareTasks";
import { useUpdateCareTask } from "@/hooks/useUpdateCareTask";
import { useAuth } from "@/store/auth/AuthContext";
import { useToast } from "@/store/ToastContext";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import type { CareTask } from "@/types/care-task";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const upcomingAlerts = [
  {
    id: 1,
    title: "Primary care appointment",
    detail: "Your visit with Dr. Morgan is coming up at 10:00 AM.",
    timing: "In 3 days",
  },
  {
    id: 2,
    title: "Prescription refill",
    detail: "Your blood pressure medication is almost due for a refill.",
    timing: "Tomorrow",
  },
];

const millisecondsPerDay = 24 * 60 * 60 * 1000;

function getDuePresentation(dueDate: string) {
  const [year, month, day] = dueDate.slice(0, 10).split("-").map(Number);
  const today = new Date();
  const todayUtc = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const dueUtc = Date.UTC(year, month - 1, day);
  const daysUntilDue = Math.round((dueUtc - todayUtc) / millisecondsPerDay);

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

function getDaysUntilDue(dueDate: string) {
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

function getTaskSortValue(task: CareTask) {
  return `${task.dueDate}T${task.dueTime ?? "23:59"}`;
}

function formatTaskTime(dueTime: string | null) {
  if (!dueTime) {
    return undefined;
  }

  const [hours, minutes] = dueTime.split(":").map(Number);

  return `Due at ${new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2000, 0, 1, hours, minutes))}`;
}

export default function RemindersScreen() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const { error, isLoading, tasks } = useCareTasks();
  const updateTaskMutation = useUpdateCareTask();
  const openTasks = tasks
    .filter((task) => task.status === "pending")
    .sort((first, second) =>
      getTaskSortValue(first).localeCompare(getTaskSortValue(second)),
    );
  const taskGroups = [
    {
      key: "due-soon",
      title: "Due Soon",
      description: "Health reminders that need your attention this week.",
      tasks: openTasks.filter((task) => getDaysUntilDue(task.dueDate) <= 7),
    },
    {
      key: "coming-up",
      title: "Coming Up",
      description: "Health reminders scheduled for the next couple of months.",
      tasks: openTasks.filter((task) => {
        const daysUntilDue = getDaysUntilDue(task.dueDate);

        return daysUntilDue > 7 && daysUntilDue <= 60;
      }),
    },
    {
      key: "later",
      title: "Later",
      description: "Future health reminders kept visible until their time comes.",
      tasks: openTasks.filter((task) => getDaysUntilDue(task.dueDate) > 60),
    },
  ];

  async function completeReminder(task: CareTask) {
    if (!token) {
      return;
    }

    try {
      await updateTaskMutation.mutateAsync([
        {
          taskId: task.id,
          providerId: task.providerId ?? undefined,
          title: task.title,
          notes: task.notes ?? undefined,
          dueDate: task.dueDate,
          dueTime: task.dueTime ?? undefined,
          status: "completed",
        },
        token,
      ]);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Health reminder completed", "success");
    } catch (requestError) {
      console.log(requestError);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast("Unable to complete health reminder", "error");
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Care Reminders</Text>
          <Text style={styles.title}>Stay Ahead of Your Care</Text>
          <Text style={styles.description}>
            Keep every upcoming health reminder visible in one place.
          </Text>
        </View>

        <View style={styles.alertPanel}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Upcoming Reminders</Text>
              <Text style={styles.sectionMeta}>Automatic from MyDocDay</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{upcomingAlerts.length}</Text>
            </View>
          </View>

          <View style={styles.alertList}>
            {upcomingAlerts.map((alert) => (
              <ReminderAlert key={alert.id} {...alert} />
            ))}
          </View>
        </View>

        <View style={styles.taskSection}>
          <View style={styles.taskHeader}>
            <View style={styles.taskHeadingGroup}>
              <Text style={styles.sectionTitle}>Health Reminders</Text>
              <Text style={styles.sectionMeta}>
                {openTasks.length}{" "}
                {openTasks.length === 1
                  ? "active reminder"
                  : "active reminders"}
              </Text>
            </View>
            <HapticButton
              accessibilityLabel="Add a health reminder"
              accessibilityRole="button"
              onPress={() => router.push("/reminders/add")}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>+</Text>
            </HapticButton>
          </View>

          <View style={styles.taskList}>
            {isLoading ? (
              <View style={styles.statusContainer}>
                <ActivityIndicator color={colors.secondary} />
                <Text style={styles.statusText}>Loading health reminders...</Text>
              </View>
            ) : null}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {!isLoading && !error && openTasks.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No active health reminders</Text>
                <Text style={styles.emptyText}>
                  Add a health reminder and it will stay visible here until it is
                  complete.
                </Text>
              </View>
            ) : null}

            {!isLoading && !error
              ? taskGroups.map((group) =>
                  group.tasks.length > 0 ? (
                    <View key={group.key} style={styles.timelineGroup}>
                      <View style={styles.timelineHeader}>
                        <View style={styles.timelineHeadingGroup}>
                          <Text style={styles.timelineTitle}>{group.title}</Text>
                          <Text style={styles.timelineDescription}>
                            {group.description}
                          </Text>
                        </View>
                        <Text style={styles.timelineCount}>
                          {group.tasks.length}
                        </Text>
                      </View>

                      <View style={styles.groupTaskList}>
                        {group.tasks.map((task) => {
                          const due = getDuePresentation(task.dueDate);

                          return (
                            <CareTaskCard
                              dueDate={task.dueDate}
                              dueLabel={due.label}
                              dueTone={due.tone}
                              isCompleting={
                                updateTaskMutation.isPending &&
                                updateTaskMutation.variables?.[0].taskId ===
                                  task.id
                              }
                              key={task.id}
                              notes={task.notes ?? undefined}
                              onComplete={() => completeReminder(task)}
                              onPress={() =>
                                router.push({
                                  pathname: "/reminders/[taskId]/edit",
                                  params: { taskId: task.id },
                                })
                              }
                              provider={task.providerName ?? undefined}
                              timeLabel={formatTaskTime(task.dueTime)}
                              title={task.title}
                            />
                          );
                        })}
                      </View>
                    </View>
                  ) : null,
                )
              : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f4f7fa",
    flex: 1,
  },
  content: {
    gap: 22,
    padding: 24,
    paddingBottom: 36,
  },
  header: {
    gap: 8,
  },
  eyebrow: {
    color: colors.secondary,
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: fontWeights.bold,
    textTransform: "uppercase",
  },
  title: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 30,
    fontWeight: fontWeights.bold,
    lineHeight: 36,
  },
  description: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
  alertPanel: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(31, 53, 87, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    alignItems: "center",
    borderBottomColor: "rgba(31, 53, 87, 0.1)",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 14,
  },
  sectionTitle: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 19,
    fontWeight: fontWeights.semibold,
  },
  sectionMeta: {
    color: "#7b8798",
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  countBadge: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 13,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  countText: {
    color: "#ffffff",
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: fontWeights.bold,
  },
  alertList: {
    gap: 0,
  },
  taskSection: {
    gap: 14,
  },
  taskHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  taskHeadingGroup: {
    flex: 1,
  },
  addButton: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderRadius: 8,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  addButtonText: {
    color: "#ffffff",
    fontFamily: fonts.body,
    fontSize: 25,
    fontWeight: fontWeights.medium,
    lineHeight: 27,
  },
  taskList: {
    gap: 22,
  },
  timelineGroup: {
    gap: 12,
  },
  timelineHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  timelineHeadingGroup: {
    flex: 1,
    minWidth: 0,
  },
  timelineTitle: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 16,
    fontWeight: fontWeights.semibold,
  },
  timelineDescription: {
    color: "#7b8798",
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  timelineCount: {
    color: colors.secondary,
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: fontWeights.bold,
    paddingTop: 2,
  },
  groupTaskList: {
    gap: 10,
  },
  statusContainer: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 36,
  },
  statusText: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 14,
  },
  errorText: {
    color: "#d24747",
    fontFamily: fonts.body,
    fontSize: 14,
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "rgba(31, 53, 87, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  emptyTitle: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 17,
    fontWeight: fontWeights.semibold,
  },
  emptyText: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
    textAlign: "center",
  },
});
