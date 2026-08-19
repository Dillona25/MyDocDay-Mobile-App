import { HapticButton } from "@/components/common/HapticButton";
import { FamilyMemberCard } from "@/components/family/family-member-card";
import { useCareMembers } from "@/hooks/useCareMembers";
import { borderPrimary } from "@/theme/borders";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import { router, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

const maxVisibleMembers = 2;

export function FamilyWidget() {
  const { careMembers, error, isLoading } = useCareMembers();
  const visibleMembers = careMembers.slice(0, maxVisibleMembers);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Your circle</Text>
          <Text style={styles.title}>Family</Text>
        </View>
        {careMembers.length > 0 ? (
          <HapticButton
            accessibilityLabel="Add family member"
            onPress={() => router.push("/family/add" as Href)}
            style={styles.iconButton}
          >
            <Text style={styles.iconButtonText}>+</Text>
          </HapticButton>
        ) : null}
      </View>

      {isLoading ? (
        <Text style={styles.helperText}>Loading family...</Text>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : careMembers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Keep family care organized</Text>
          <Text style={styles.emptyText}>
            Add someone whose appointments, providers, and reminders you help
            manage.
          </Text>
          <HapticButton
            onPress={() => router.push("/family/add" as Href)}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>Add family member</Text>
          </HapticButton>
        </View>
      ) : (
        <View style={styles.list}>
          {visibleMembers.map((careMember) => (
            <FamilyMemberCard
              careMember={careMember}
              key={careMember.id}
              returnTo="/dashboard"
            />
          ))}
          <HapticButton
            onPress={() => router.push("/family" as Href)}
            style={styles.footerButton}
          >
            <Text style={styles.footerButtonText}>
              {careMembers.length > maxVisibleMembers
                ? `View all ${careMembers.length} family members`
                : "Manage family"}
            </Text>
          </HapticButton>
        </View>
      )}
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  header: {
    alignItems: "center",
    borderBottomColor: "rgba(31, 53, 87, 0.12)",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingBottom: 14,
  },
  eyebrow: {
    color: colors.secondary,
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: fontWeights.semibold,
    textTransform: "uppercase",
  },
  title: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 20,
    fontWeight: fontWeights.semibold,
    marginTop: 2,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "rgba(28, 184, 178, 0.14)",
    borderRadius: 8,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  iconButtonText: {
    color: colors.secondary,
    fontFamily: fonts.body,
    fontSize: 23,
    fontWeight: fontWeights.bold,
    lineHeight: 25,
  },
  list: { gap: 10 },
  helperText: { color: "#536173", fontFamily: fonts.body, fontSize: 14 },
  errorText: { color: "#d24747", fontFamily: fonts.body, fontSize: 14 },
  emptyState: { alignItems: "center", paddingHorizontal: 12, paddingVertical: 8 },
  emptyTitle: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 17,
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
  addButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 14,
    minHeight: 44,
    paddingHorizontal: 18,
  },
  addButtonText: {
    color: "#ffffff",
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: fontWeights.semibold,
  },
  footerButton: {
    alignItems: "center",
    borderTopColor: "rgba(31, 53, 87, 0.12)",
    borderTopWidth: 1,
    marginTop: 4,
    paddingTop: 14,
  },
  footerButtonText: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: fontWeights.semibold,
  },
});
