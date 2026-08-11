import { HapticButton } from "@/components/common/HapticButton";
import {
  formatTaskTime,
  getDaysUntilDue,
  getDuePresentation,
  getTaskSortValue,
} from "@/components/reminders/reminder-display";
import { useCareTasks } from "@/hooks/useCareTasks";
import { useUpdateCareTask } from "@/hooks/useUpdateCareTask";
import { useAuth } from "@/store/auth/AuthContext";
import { useToast } from "@/store/ToastContext";
import { borderPrimary } from "@/theme/borders";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import type { CareTask } from "@/types/care-task";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const maximumVisibleReminders = 3;

export function ReminderWidget() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const { error, isLoading, tasks } = useCareTasks();
  const updateTaskMutation = useUpdateCareTask();
  const activeReminders = tasks
    .filter((task) => task.status === "pending")
    .sort((first, second) =>
      getTaskSortValue(first).localeCompare(getTaskSortValue(second)),
    );
  const visibleReminders = activeReminders.slice(0, maximumVisibleReminders);
  const hiddenReminderCount = activeReminders.length - visibleReminders.length;
  const dueSoonCount = activeReminders.filter(
    (task) => getDaysUntilDue(task.dueDate) <= 2,
  ).length;

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
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headingGroup}>
          <Text style={styles.title}>Health Reminders</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>{dueSoonCount} due soon</Text>
            <View style={styles.summaryDivider} />
            <Text style={styles.summaryText}>
              {activeReminders.length} active
            </Text>
          </View>
        </View>

      </View>

      {isLoading ? (
        <View style={styles.statusContainer}>
          <ActivityIndicator color={colors.secondary} />
          <Text style={styles.statusText}>Loading reminders...</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!isLoading && !error && activeReminders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No health reminders yet</Text>
          <Text style={styles.emptyText}>
            Use the + button to add a health reminder. It will appear here.
          </Text>
        </View>
      ) : null}

      {!isLoading && !error && visibleReminders.length > 0 ? (
        <View style={styles.reminderList}>
          {visibleReminders.map((task) => {
            const due = getDuePresentation(task.dueDate);
            const metadata = [
              formatTaskTime(task.dueTime),
              task.providerName ?? undefined,
            ]
              .filter(Boolean)
              .join(" - ");

            return (
              <HapticButton
                accessibilityLabel={`Edit ${task.title} reminder`}
                accessibilityRole="button"
                key={task.id}
                onPress={() =>
                  router.push({
                    pathname: "/reminders/[taskId]/edit",
                    params: { taskId: task.id },
                  })
                }
                style={({ pressed }) => [
                  styles.reminderRow,
                  pressed ? styles.reminderRowPressed : null,
                ]}
              >
                <HapticButton
                  accessibilityLabel={`Mark ${task.title} complete`}
                  accessibilityRole="checkbox"
                  disabled={
                    updateTaskMutation.isPending &&
                    updateTaskMutation.variables?.[0].taskId === task.id
                  }
                  onPress={(event) => {
                    event.stopPropagation();
                    completeReminder(task);
                  }}
                  style={styles.completionButton}
                >
                  <View
                    style={[
                      styles.completionDot,
                      updateTaskMutation.isPending &&
                      updateTaskMutation.variables?.[0].taskId === task.id
                        ? styles.completionDotPending
                        : null,
                    ]}
                  />
                </HapticButton>

                <View style={styles.reminderContent}>
                  <Text numberOfLines={1} style={styles.reminderTitle}>
                    {task.title}
                  </Text>
                  {metadata ? (
                    <Text numberOfLines={1} style={styles.reminderMeta}>
                      {metadata}
                    </Text>
                  ) : null}
                </View>

                <View
                  style={[
                    styles.dueBadge,
                    due.tone === "safe" ? styles.dueBadgeSafe : null,
                    due.tone === "warning" ? styles.dueBadgeWarning : null,
                    due.tone === "urgent" ? styles.dueBadgeUrgent : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.dueText,
                      due.tone === "safe" ? styles.dueTextSafe : null,
                      due.tone === "warning" ? styles.dueTextWarning : null,
                      due.tone === "urgent" ? styles.dueTextUrgent : null,
                    ]}
                  >
                    {due.label}
                  </Text>
                </View>
              </HapticButton>
            );
          })}

          {hiddenReminderCount > 0 ? (
            <Text style={styles.moreText}>+{hiddenReminderCount} later</Text>
          ) : null}
        </View>
      ) : null}

      <HapticButton
        onPress={() => router.push("/reminders")}
        style={styles.footerButton}
      >
        <Text style={styles.footerButtonText}>View all reminders</Text>
      </HapticButton>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...borderPrimary,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    elevation: 3,
    padding: 18,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  header: {
    alignItems: "center",
    borderBottomColor: "rgba(31, 53, 87, 0.1)",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 14,
  },
  headingGroup: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 20,
    fontWeight: fontWeights.semibold,
  },
  summaryRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    marginTop: 2,
  },
  summaryText: {
    color: "#7b8798",
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: fontWeights.medium,
  },
  summaryDivider: {
    backgroundColor: "#cbd5e1",
    height: 11,
    width: 1,
  },
  statusContainer: {
    alignItems: "center",
    gap: 9,
    paddingVertical: 28,
  },
  statusText: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 13,
  },
  errorText: {
    color: "#d24747",
    fontFamily: fonts.body,
    fontSize: 13,
    paddingVertical: 18,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  emptyTitle: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 16,
    fontWeight: fontWeights.semibold,
    textAlign: "center",
  },
  emptyText: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
    textAlign: "center",
  },
  reminderList: {
    gap: 0,
  },
  reminderRow: {
    alignItems: "center",
    borderBottomColor: "rgba(31, 53, 87, 0.08)",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 62,
    paddingVertical: 11,
  },
  reminderRowPressed: {
    opacity: 0.78,
  },
  completionButton: {
    alignItems: "center",
    borderColor: "#9ba8b9",
    borderRadius: 11,
    borderWidth: 2,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  completionDot: {
    backgroundColor: "transparent",
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  completionDotPending: {
    backgroundColor: colors.secondary,
  },
  reminderContent: {
    flex: 1,
    minWidth: 0,
  },
  reminderTitle: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: fontWeights.semibold,
  },
  reminderMeta: {
    color: "#7b8798",
    fontFamily: fonts.body,
    fontSize: 11,
    marginTop: 2,
  },
  dueBadge: {
    borderRadius: 5,
    flexShrink: 0,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  dueBadgeSafe: {
    backgroundColor: "rgba(47, 125, 87, 0.13)",
  },
  dueBadgeWarning: {
    backgroundColor: "rgba(196, 139, 23, 0.14)",
  },
  dueBadgeUrgent: {
    backgroundColor: "rgba(201, 75, 75, 0.12)",
  },
  dueText: {
    fontFamily: fonts.body,
    fontSize: 9,
    fontWeight: fontWeights.bold,
  },
  dueTextSafe: {
    color: "#2f7d57",
  },
  dueTextWarning: {
    color: "#9a6a0d",
  },
  dueTextUrgent: {
    color: "#b53e3e",
  },
  moreText: {
    color: "#94a3b8",
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: fontWeights.semibold,
    paddingTop: 10,
    textAlign: "center",
  },
  footerButton: {
    alignItems: "center",
    borderTopColor: "rgba(31, 53, 87, 0.12)",
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 15,
  },
  footerButtonText: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: fontWeights.semibold,
  },
});
