import { BackButton } from "@/components/common/BackButton";
import { HapticButton } from "@/components/common/HapticButton";
import AddProviderForm from "@/components/providers/add-provider-form";
import { DeleteProviderModal } from "@/components/providers/delete-provider-modal";
import { useAppointments } from "@/hooks/useAppointments";
import { useDeleteProvider } from "@/hooks/useDeleteProvider";
import { useProviders } from "@/hooks/useProviders";
import { useUpdateProvider } from "@/hooks/useUpdateProvider";
import { getFullStateName } from "@/data/usStates";
import { useToast } from "@/store/ToastContext";
import { useAuth } from "@/store/auth/AuthContext";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import type { ProviderFormData } from "@/types/provider-form";
import type { CreateProviderInput } from "@/types/provider";
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

export default function EditProviderScreen() {
  const { providerId } = useLocalSearchParams<{ providerId: string }>();
  const numericProviderId = Number(providerId);
  const { error, isLoading, providers } = useProviders();
  const { appointments } = useAppointments();
  const { token } = useAuth();
  const { showToast } = useToast();
  const deleteProviderMutation = useDeleteProvider();
  const updateProviderMutation = useUpdateProvider();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const provider = providers.find(
    (providerItem) => providerItem.id === numericProviderId,
  );
  const initialFormData = useMemo<ProviderFormData | null>(() => {
    if (!provider) {
      return null;
    }

    return {
      isForAccountOwner: provider.isForAccountOwner,
      careMemberIds: provider.careMembers.map((member) => member.id),
      firstName: provider.firstName ?? "",
      lastName: provider.lastName ?? "",
      clinicName: provider.clinicName ?? "",
      specialty: provider.specialty,
      phoneNumber: provider.phoneNumber ?? "",
      type: provider.type,
      imageUrl: provider.imageUrl ?? "",
      streetAddress: provider.streetAddress ?? "",
      city: provider.city ?? "",
      state: getFullStateName(provider.state ?? ""),
      zipCode: provider.zipCode ?? "",
      scheduleAnswer: provider.visitSchedule ? "annual_months" : "none",
      annualMonths: provider.visitSchedule?.annualMonths ?? [],
      nextAppointmentStatus:
        provider.visitSchedule?.configuredNextAppointmentStatus ??
        provider.visitSchedule?.nextAppointmentStatus ??
        "",
      reminderLeadDays: provider.visitSchedule?.reminderLeadDays ?? 30,
      secondReminderLeadDays:
        provider.visitSchedule?.secondReminderLeadDays ?? null,
    };
  }, [provider]);
  const appointmentCount = appointments.filter(
    (appointment) => appointment.providerId === numericProviderId,
  ).length;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centeredState}>
          <ActivityIndicator color={colors.secondary} />
          <Text style={styles.stateText}>Loading provider...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !provider || !initialFormData) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centeredState}>
          <Text style={styles.stateTitle}>Provider not available</Text>
          <Text style={styles.stateText}>
            {error || "This provider could not be found in your care team."}
          </Text>
          <HapticButton
            onPress={() => router.replace("/providers" as Href)}
            style={styles.returnButton}
          >
            <Text style={styles.returnButtonText}>Return to providers</Text>
          </HapticButton>
        </View>
      </SafeAreaView>
    );
  }

  const displayName =
    provider.type === "clinic"
      ? (provider.clinicName ?? "Clinic")
      : [provider.firstName, provider.lastName].filter(Boolean).join(" ");
  const providerTypeLabel = provider.type === "clinic" ? "Clinic" : "Provider";

  async function handleUpdateProvider(providerData: CreateProviderInput) {
    if (!token) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast("Your session has expired. Please sign in again.", "error");
      return;
    }

    try {
      const result = await updateProviderMutation.mutateAsync([
        {
          ...providerData,
          providerId: numericProviderId,
        },
        token,
      ]);
      const updatedDisplayName =
        result.provider.type === "clinic"
          ? (result.provider.clinicName ?? "Clinic")
          : [result.provider.firstName, result.provider.lastName]
              .filter(Boolean)
              .join(" ");

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      showToast(`${updatedDisplayName} updated successfully`, "success");
      router.replace(`/providers/${numericProviderId}` as Href);
    } catch (updateError) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update provider",
        "error",
      );
    }
  }

  async function handleDeleteProvider() {
    if (!token) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast("Your session has expired. Please sign in again.", "error");
      return;
    }

    try {
      await deleteProviderMutation.mutateAsync([numericProviderId, token]);
      setDeleteModalVisible(false);
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      showToast(`${displayName} deleted successfully`, "success");
      router.replace("/providers" as Href);
    } catch (deleteError) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete provider",
        "error",
      );
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.backButton}>
          <BackButton
            href={`/providers/${numericProviderId}` as Href}
          />
        </View>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Care Team</Text>
          <Text style={styles.title}>Edit {providerTypeLabel}</Text>
          <Text style={styles.description}>
            Review and update the information stored for {displayName}.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <AddProviderForm
            footer={
              <View style={styles.dangerSection}>
                <Text style={styles.dangerTitle}>Delete {providerTypeLabel}</Text>
                <Text style={styles.dangerText}>
                  This permanently removes {displayName} and any linked
                  appointments.
                </Text>
                <HapticButton
                  onPress={() => setDeleteModalVisible(true)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>
                    Delete {providerTypeLabel}
                  </Text>
                </HapticButton>
              </View>
            }
            initialData={initialFormData}
            mode="edit"
            onEditSubmit={handleUpdateProvider}
          />
        </View>
      </View>

      <DeleteProviderModal
        appointmentCount={appointmentCount}
        displayName={displayName}
        isDeleting={deleteProviderMutation.isPending}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={handleDeleteProvider}
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
  backButton: {
    marginBottom: 12,
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
