import { BackButton } from "@/components/common/BackButton";
import { HapticButton } from "@/components/common/HapticButton";
import AddCareTaskForm from "@/components/reminders/add-care-task-form";
import { DeleteCareTaskModal } from "@/components/reminders/delete-care-task-modal";
import { useCareTasks } from "@/hooks/useCareTasks";
import { useDeleteCareTask } from "@/hooks/useDeleteCareTask";
import { useAuth } from "@/store/auth/AuthContext";
import { useToast } from "@/store/ToastContext";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function EditTaskScreen() {
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();
  const { token } = useAuth();
  const { showToast } = useToast();
  const { error, isLoading, tasks } = useCareTasks();
  const deleteTaskMutation = useDeleteCareTask();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const numericTaskId = Number(taskId);
  const task = tasks.find((careTask) => careTask.id === numericTaskId);

  async function deleteReminder() {
    if (!token || !task) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast("Your session has expired. Please sign in again.", "error");
      return;
    }

    try {
      await deleteTaskMutation.mutateAsync([task.id, token]);
      setDeleteModalVisible(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Health reminder deleted successfully", "success");
      router.dismissTo("/reminders");
    } catch (deleteError) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete health reminder",
        "error",
      );
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <BackButton href="/reminders" navigationMode="dismiss" />

        <View style={styles.header}>
          <Text style={styles.eyebrow}>Health Reminders</Text>
          <Text style={styles.title}>Edit Health Reminder</Text>
          <Text style={styles.description}>
            Update when this reminder is due or adjust its care details.
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.statusContainer}>
            <ActivityIndicator color={colors.secondary} />
            <Text style={styles.statusText}>Loading health reminder...</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!isLoading && !error && !task ? (
          <View style={styles.statusContainer}>
            <Text style={styles.notFoundTitle}>Reminder not found</Text>
            <Text style={styles.statusText}>
              This health reminder may no longer be available.
            </Text>
          </View>
        ) : null}

        {task ? (
          <View style={styles.formContainer}>
            <AddCareTaskForm
              footer={
                <View style={styles.dangerSection}>
                  <Text style={styles.dangerTitle}>Delete Health Reminder</Text>
                  <Text style={styles.dangerText}>
                    This permanently removes {task.title} from your health
                    reminders.
                  </Text>
                  <HapticButton
                    onPress={() => setDeleteModalVisible(true)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteButtonText}>
                      Delete Health Reminder
                    </Text>
                  </HapticButton>
                </View>
              }
              task={task}
            />
          </View>
        ) : null}
      </View>

      {task ? (
        <DeleteCareTaskModal
          isDeleting={deleteTaskMutation.isPending}
          onClose={() => setDeleteModalVisible(false)}
          onConfirm={deleteReminder}
          title={task.title}
          visible={deleteModalVisible}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f4f7fa",
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  header: {
    gap: 8,
    marginTop: 8,
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
  formContainer: {
    flex: 1,
    paddingTop: 24,
  },
  dangerSection: {
    borderTopColor: "rgba(210, 71, 71, 0.22)",
    borderTopWidth: 1,
    gap: 8,
    marginTop: 8,
    paddingTop: 20,
  },
  dangerTitle: {
    color: "#d24747",
    fontFamily: fonts.heading,
    fontSize: 17,
    fontWeight: fontWeights.semibold,
  },
  dangerText: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#d24747",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 6,
    minHeight: 48,
  },
  deleteButtonText: {
    color: "#d24747",
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: fontWeights.semibold,
  },
  statusContainer: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 48,
  },
  statusText: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  notFoundTitle: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 18,
    fontWeight: fontWeights.semibold,
  },
  errorText: {
    color: "#d24747",
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: 24,
  },
});
