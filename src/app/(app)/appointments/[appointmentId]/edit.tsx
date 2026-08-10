import AddAppointmentForm from "@/components/appointments/add-appointment-form";
import { DeleteAppointmentModal } from "@/components/appointments/delete-appointment-modal";
import { HapticButton } from "@/components/common/HapticButton";
import { useAppointments } from "@/hooks/useAppointments";
import { useDeleteAppointment } from "@/hooks/useDeleteAppointment";
import { useUpdateAppointment } from "@/hooks/useUpdateAppointment";
import { useToast } from "@/store/ToastContext";
import { useAuth } from "@/store/auth/AuthContext";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import type { AppointmentFormData } from "@/types/appointment-form";
import * as Haptics from "expo-haptics";
import { router, type Href, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function EditAppointmentScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const numericAppointmentId = Number(appointmentId);
  const { appointments, aptError, isLoadingApt } = useAppointments();
  const { token } = useAuth();
  const { showToast } = useToast();
  const deleteAppointmentMutation = useDeleteAppointment();
  const updateAppointmentMutation = useUpdateAppointment();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const appointment = appointments.find(
    (appointmentItem) => appointmentItem.id === numericAppointmentId,
  );
  const initialFormData = useMemo<AppointmentFormData | null>(() => {
    if (!appointment) {
      return null;
    }

    return {
      title: appointment.title,
      date: appointment.date.slice(0, 10),
      startTime: appointment.startTime.slice(0, 5),
      appointmentType: appointment.appointmentType,
      providerSelection: appointment.providerId
        ? "saved"
        : appointment.doctorName
          ? "other"
          : "",
      providerId: appointment.providerId ? String(appointment.providerId) : "",
      doctorName: appointment.providerId ? "" : (appointment.doctorName ?? ""),
      location: appointment.location ?? "",
    };
  }, [appointment]);

  if (isLoadingApt) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centeredState}>
          <ActivityIndicator color={colors.secondary} />
          <Text style={styles.stateText}>Loading appointment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (aptError || !appointment || !initialFormData) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centeredState}>
          <Text style={styles.stateTitle}>Appointment not available</Text>
          <Text style={styles.stateText}>
            {aptError || "This appointment could not be found in your schedule."}
          </Text>
          <HapticButton
            onPress={() => router.replace("/appointments" as Href)}
            style={styles.returnButton}
          >
            <Text style={styles.returnButtonText}>Return to appointments</Text>
          </HapticButton>
        </View>
      </SafeAreaView>
    );
  }

  const appointmentTitle = appointment.title;

  async function handleUpdateAppointment(formData: AppointmentFormData) {
    if (!token) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast("Your session has expired. Please sign in again.", "error");
      return;
    }

    try {
      const result = await updateAppointmentMutation.mutateAsync([
        {
          appointmentId: numericAppointmentId,
          title: formData.title.trim(),
          date: formData.date.slice(0, 10),
          startTime: formData.startTime.slice(0, 5),
          appointmentType: formData.appointmentType || "in_person",
          providerId:
            formData.providerSelection === "saved" && formData.providerId
              ? Number(formData.providerId)
              : undefined,
          doctorName:
            formData.providerSelection === "other"
              ? formData.doctorName.trim()
              : undefined,
          location: formData.location.trim() || undefined,
        },
        token,
      ]);

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      showToast(`${result.appointment.title} updated successfully`, "success");
      router.replace(`/appointments/${numericAppointmentId}` as Href);
    } catch (updateError) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update appointment",
        "error",
      );
    }
  }

  async function handleDeleteAppointment() {
    if (!token) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast("Your session has expired. Please sign in again.", "error");
      return;
    }

    try {
      await deleteAppointmentMutation.mutateAsync([
        numericAppointmentId,
        token,
      ]);
      setDeleteModalVisible(false);
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      showToast(`${appointmentTitle} deleted successfully`, "success");
      router.replace("/appointments" as Href);
    } catch (deleteError) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete appointment",
        "error",
      );
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Appointments</Text>
          <Text style={styles.title}>Edit Appointment</Text>
          <Text style={styles.description}>
            Review and update the details stored for {appointmentTitle}.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <AddAppointmentForm
            footer={
              <View style={styles.dangerSection}>
                <Text style={styles.dangerTitle}>Delete Appointment</Text>
                <Text style={styles.dangerText}>
                  This permanently removes {appointmentTitle} from your care
                  schedule.
                </Text>
                <HapticButton
                  onPress={() => setDeleteModalVisible(true)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>
                    Delete Appointment
                  </Text>
                </HapticButton>
              </View>
            }
            initialData={initialFormData}
            mode="edit"
            onEditSubmit={handleUpdateAppointment}
          />
        </View>
      </View>

      <DeleteAppointmentModal
        appointmentTitle={appointmentTitle}
        isDeleting={deleteAppointmentMutation.isPending}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={handleDeleteAppointment}
        visible={deleteModalVisible}
      />
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
    paddingTop: 24,
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
    fontSize: 14,
    lineHeight: 21,
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
  centeredState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  stateTitle: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 22,
    fontWeight: fontWeights.semibold,
    textAlign: "center",
  },
  stateText: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  returnButton: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 20,
    minHeight: 46,
    paddingHorizontal: 18,
  },
  returnButtonText: {
    color: "#ffffff",
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: fontWeights.semibold,
  },
});
