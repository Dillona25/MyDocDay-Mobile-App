import { BackButton } from "@/components/common/BackButton";
import { HapticButton } from "@/components/common/HapticButton";
import { FamilyMemberCard } from "@/components/family/family-member-card";
import { useCareMembers } from "@/hooks/useCareMembers";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import { router, type Href } from "expo-router";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

export default function FamilyScreen() {
  const { careMembers, error, isLoading } = useCareMembers();

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <BackButton href="/account" navigationMode="navigate" />

        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>Family care</Text>
            <Text style={styles.title}>Manage Family</Text>
            <Text style={styles.description}>
              Keep each person&apos;s care information clear and easy to manage.
            </Text>
          </View>
          {careMembers.length > 0 ? (
            <HapticButton
              onPress={() => router.push("/family/add" as Href)}
              style={styles.headerAddButton}
            >
              <Text style={styles.headerAddButtonText}>Add</Text>
            </HapticButton>
          ) : null}
        </View>

        {isLoading ? (
          <Text style={styles.helperText}>Loading family...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : careMembers.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyAvatarGroup}>
              <View style={styles.emptyAvatar} />
              <View style={[styles.emptyAvatar, styles.emptyAvatarOffset]} />
            </View>
            <Text style={styles.emptyTitle}>No family members yet</Text>
            <Text style={styles.emptyText}>
              Add someone whose healthcare you help organize. You can connect
              their providers, appointments, and reminders later.
            </Text>
            <HapticButton
              onPress={() => router.push("/family/add" as Href)}
              style={styles.emptyAddButton}
            >
              <Text style={styles.emptyAddButtonText}>Add Family Member</Text>
            </HapticButton>
          </View>
        ) : (
          <View style={styles.list}>
            {careMembers.map((careMember) => (
              <FamilyMemberCard
                careMember={careMember}
                key={careMember.id}
                variant="full"
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#f4f7fa", flex: 1 },
  content: { gap: 22, padding: 24, paddingBottom: 120 },
  headerRow: { alignItems: "flex-start", flexDirection: "row", gap: 16 },
  headerCopy: { flex: 1, minWidth: 0 },
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
    marginTop: 8,
  },
  description: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
  },
  headerAddButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 23,
    minHeight: 42,
    paddingHorizontal: 16,
  },
  headerAddButtonText: {
    color: "#ffffff",
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: fontWeights.semibold,
  },
  list: { gap: 12 },
  helperText: { color: "#536173", fontFamily: fonts.body, fontSize: 14 },
  errorText: { color: "#d24747", fontFamily: fonts.body, fontSize: 14 },
  emptyState: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "rgba(31, 53, 87, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    padding: 28,
  },
  emptyAvatarGroup: { height: 58, marginBottom: 14, width: 86 },
  emptyAvatar: {
    backgroundColor: "rgba(28, 184, 178, 0.18)",
    borderColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 3,
    height: 54,
    left: 4,
    position: "absolute",
    top: 2,
    width: 54,
  },
  emptyAvatarOffset: {
    backgroundColor: "rgba(31, 53, 87, 0.14)",
    left: 32,
    top: 8,
  },
  emptyTitle: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 20,
    fontWeight: fontWeights.semibold,
  },
  emptyText: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    textAlign: "center",
  },
  emptyAddButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 18,
    minHeight: 48,
    paddingHorizontal: 20,
  },
  emptyAddButtonText: {
    color: "#ffffff",
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: fontWeights.semibold,
  },
});
