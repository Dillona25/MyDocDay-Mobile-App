import {
  deleteCareMemberAvatar,
  uploadCareMemberAvatar,
} from "@/api/care-members/care-members";
import { BackButton } from "@/components/common/BackButton";
import { FamilyMemberForm } from "@/components/family/family-member-form";
import { RemoveFamilyMemberModal } from "@/components/family/remove-family-member-modal";
import {
  useArchiveCareMember,
  useUpdateCareMember,
} from "@/hooks/useCareMemberMutations";
import { useCareMembers } from "@/hooks/useCareMembers";
import { useAuth } from "@/store/auth/AuthContext";
import { useToast } from "@/store/ToastContext";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import type { CareMemberFormSubmission } from "@/types/care-member";
import * as Haptics from "expo-haptics";
import { router, type Href, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { HapticButton } from "@/components/common/HapticButton";

export default function EditFamilyMemberScreen() {
  const { careMemberId } = useLocalSearchParams<{ careMemberId: string }>();
  const numericCareMemberId = Number(careMemberId);
  const { token } = useAuth();
  const { showToast } = useToast();
  const { careMembers, error, isLoading, refreshCareMembers } = useCareMembers();
  const updateMutation = useUpdateCareMember();
  const archiveMutation = useArchiveCareMember();
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const careMember = careMembers.find(
    (member) => member.id === numericCareMemberId,
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centeredState}>
          <ActivityIndicator color={colors.secondary} />
          <Text style={styles.stateText}>Loading family member...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !careMember) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centeredState}>
          <Text style={styles.stateTitle}>Family member not available</Text>
          <Text style={styles.stateText}>{error || "This person could not be found."}</Text>
          <HapticButton onPress={() => router.replace("/family" as Href)} style={styles.returnButton}>
            <Text style={styles.returnButtonText}>Return to family</Text>
          </HapticButton>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = [careMember.firstName, careMember.lastName]
    .filter(Boolean)
    .join(" ");
  const careMemberFirstName = careMember.firstName;

  async function handleUpdate(submission: CareMemberFormSubmission) {
    if (!token) {
      showToast("Your session has expired. Please sign in again.", "error");
      return;
    }

    try {
      const result = await updateMutation.mutateAsync([
        { ...submission.input, careMemberId: numericCareMemberId },
        token,
      ]);

      if (submission.selectedImageUri) {
        await uploadCareMemberAvatar(
          numericCareMemberId,
          submission.selectedImageUri,
          token,
        );
      } else if (submission.shouldRemoveImage) {
        await deleteCareMemberAvatar(numericCareMemberId, token);
      }

      await refreshCareMembers();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(`${result.careMember.firstName} updated successfully`, "success");
      router.replace(`/family/${numericCareMemberId}` as Href);
    } catch (updateError) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update family member",
        "error",
      );
    }
  }

  async function handleRemove() {
    if (!token) {
      showToast("Your session has expired. Please sign in again.", "error");
      return;
    }

    try {
      await archiveMutation.mutateAsync([numericCareMemberId, token]);
      setRemoveModalVisible(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(`${careMemberFirstName} removed from your family`, "success");
      router.replace("/family" as Href);
    } catch (removeError) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(
        removeError instanceof Error
          ? removeError.message
          : "Unable to remove family member",
        "error",
      );
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.content}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        <BackButton href={`/family/${numericCareMemberId}` as Href} />
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Family care</Text>
          <Text style={styles.title}>Edit Family Member</Text>
          <Text style={styles.description}>
            Review and update the information stored for {displayName}.
          </Text>
        </View>
        <FamilyMemberForm
          careMember={careMember}
          footer={
            <View style={styles.dangerSection}>
              <Text style={styles.dangerTitle}>Remove Family Member</Text>
              <Text style={styles.dangerText}>
                Remove {displayName} from your active family list. Their record
                will be archived.
              </Text>
              <HapticButton
                onPress={() => setRemoveModalVisible(true)}
                style={styles.removeButton}
              >
                <Text style={styles.removeButtonText}>Remove Family Member</Text>
              </HapticButton>
            </View>
          }
          isSubmitting={updateMutation.isPending}
          mode="edit"
          onSubmit={handleUpdate}
        />
      </ScrollView>

      <RemoveFamilyMemberModal
        displayName={displayName}
        isRemoving={archiveMutation.isPending}
        onClose={() => setRemoveModalVisible(false)}
        onConfirm={handleRemove}
        visible={removeModalVisible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#f4f7fa", flex: 1 },
  content: { gap: 24, padding: 24, paddingBottom: 120 },
  centeredState: { alignItems: "center", flex: 1, gap: 10, justifyContent: "center", padding: 28 },
  stateTitle: { color: colors.primary, fontFamily: fonts.heading, fontSize: 20, fontWeight: fontWeights.semibold },
  stateText: { color: "#536173", fontFamily: fonts.body, fontSize: 14, textAlign: "center" },
  returnButton: { backgroundColor: colors.primary, borderRadius: 8, marginTop: 8, paddingHorizontal: 18, paddingVertical: 12 },
  returnButtonText: { color: "#ffffff", fontFamily: fonts.body, fontWeight: fontWeights.semibold },
  header: { gap: 8 },
  eyebrow: { color: colors.secondary, fontFamily: fonts.heading, fontSize: 14, fontWeight: fontWeights.bold, textTransform: "uppercase" },
  title: { color: colors.primary, fontFamily: fonts.heading, fontSize: 30, fontWeight: fontWeights.bold, lineHeight: 36 },
  description: { color: "#536173", fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  dangerSection: { borderTopColor: "rgba(210, 71, 71, 0.18)", borderTopWidth: 1, gap: 8, marginTop: 8, paddingTop: 22 },
  dangerTitle: { color: "#b93636", fontFamily: fonts.heading, fontSize: 18, fontWeight: fontWeights.semibold },
  dangerText: { color: "#536173", fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  removeButton: { alignItems: "center", borderColor: "rgba(210, 71, 71, 0.55)", borderRadius: 8, borderWidth: 1, justifyContent: "center", marginTop: 6, minHeight: 48 },
  removeButtonText: { color: "#d24747", fontFamily: fonts.body, fontSize: 14, fontWeight: fontWeights.semibold },
});
