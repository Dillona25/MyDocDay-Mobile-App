import { CareTaskCard } from "@/components/reminders/care-task-card";
import { CareScopeSelector } from "@/components/family/care-scope-selector";
import {
  formatTaskTime,
  getDaysUntilDue,
  getDuePresentation,
  getTaskSortValue,
} from "@/components/reminders/reminder-display";
import { useCareTasks } from "@/hooks/useCareTasks";
import { useUpdateCareTask } from "@/hooks/useUpdateCareTask";
import { useAuth } from "@/store/auth/AuthContext";
import { useCareScope } from "@/store/care-scope/CareScopeContext";
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

export default function RemindersScreen() {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const { matchesCareMember } = useCareScope();
  const { error, isLoading, tasks } = useCareTasks();
  const updateTaskMutation = useUpdateCareTask();
  const openTasks = tasks
    .filter(
      (task) =>
        task.status === "pending" && matchesCareMember(task.careMemberId),
    )
    .sort((first, second) =>
      getTaskSortValue(first).localeCompare(getTaskSortValue(second)),
    );
  const taskGroups = [
    {
      key: "due-soon",
      title: "Due Soon",
      description: "Due within the next 7 days",
      tasks: openTasks.filter((task) => getDaysUntilDue(task.dueDate) <= 7),
    },
    {
      key: "coming-up",
      title: "Coming Up",
      description: "Due in 8-59 days",
      tasks: openTasks.filter((task) => {
        const daysUntilDue = getDaysUntilDue(task.dueDate);

        return daysUntilDue > 7 && daysUntilDue < 60;
      }),
    },
    {
      key: "later",
      title: "Due Later",
      description: "Due in 60 days or more",
      tasks: openTasks.filter((task) => getDaysUntilDue(task.dueDate) >= 60),
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
          <Text style={styles.eyebrow}>Health Reminders</Text>
          <Text style={styles.title}>Stay Ahead of Your Care</Text>
          <Text style={styles.description}>
            Keep every upcoming health reminder visible in one place.
          </Text>
        </View>

        <CareScopeSelector />

        <View style={styles.taskSection}>
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
                <Text style={styles.emptyTitle}>No health reminders yet</Text>
                <Text style={styles.emptyText}>
                  Use the + button to add a health reminder. It will appear here.
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
                      </View>

                      <View style={styles.groupTaskList}>
                        {group.tasks.map((task) => {
                          const due = getDuePresentation(task.dueDate);

                          return (
                            <CareTaskCard
                              careMemberName={
                                task.careMember?.firstName ||
                                user?.firstName ||
                                "Account owner"
                              }
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
  taskSection: {
    gap: 14,
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
    marginTop: 2,
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
