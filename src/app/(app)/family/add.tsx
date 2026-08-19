import { uploadCareMemberAvatar } from "@/api/care-members/care-members";
import { BackButton } from "@/components/common/BackButton";
import { FamilyMemberForm } from "@/components/family/family-member-form";
import { useCreateCareMember } from "@/hooks/useCareMemberMutations";
import { useCareMembers } from "@/hooks/useCareMembers";
import { useAuth } from "@/store/auth/AuthContext";
import { useToast } from "@/store/ToastContext";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import type { CareMemberFormSubmission } from "@/types/care-member";
import * as Haptics from "expo-haptics";
import { router, type Href } from "expo-router";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

export default function AddFamilyMemberScreen() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const { refreshCareMembers } = useCareMembers();
  const createMutation = useCreateCareMember();

  async function handleCreate(submission: CareMemberFormSubmission) {
    if (!token) {
      showToast("Your session has expired. Please sign in again.", "error");
      return;
    }

    try {
      const result = await createMutation.mutateAsync([submission.input, token]);
      let photoFailed = false;

      if (submission.selectedImageUri) {
        try {
          await uploadCareMemberAvatar(
            result.careMember.id,
            submission.selectedImageUri,
            token,
          );
          await refreshCareMembers();
        } catch {
          photoFailed = true;
        }
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(
        photoFailed
          ? `${result.careMember.firstName} was added, but the photo could not be uploaded.`
          : `${result.careMember.firstName} added to your family`,
        photoFailed ? "error" : "success",
      );
      router.replace("/family" as Href);
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(
        error instanceof Error ? error.message : "Unable to add family member",
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
        <BackButton href={"/family" as Href} />
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Family care</Text>
          <Text style={styles.title}>Add Family Member</Text>
          <Text style={styles.description}>
            Add someone whose healthcare you help keep organized.
          </Text>
        </View>
        <FamilyMemberForm
          isSubmitting={createMutation.isPending}
          mode="add"
          onSubmit={handleCreate}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#f4f7fa", flex: 1 },
  content: { gap: 24, padding: 24, paddingBottom: 120 },
  header: { gap: 8 },
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
});
