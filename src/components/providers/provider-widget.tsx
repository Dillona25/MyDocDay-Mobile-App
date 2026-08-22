import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import type { Provider } from "@/types/provider";
import { useCareMembers } from "@/hooks/useCareMembers";
import { useAuth } from "@/store/auth/AuthContext";
import { Image } from "expo-image";
import { router, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { HapticButton } from "../common/HapticButton";

type ProviderWidgetProps = {
  provider: Provider;
  onDelete?: () => void;
  returnTo?: string;
  variant?: "compact" | "full";
};

export function ProviderWidget({
  provider,
  onDelete,
  returnTo,
  variant = "compact",
}: ProviderWidgetProps) {
  const { careMembers } = useCareMembers();
  const { user } = useAuth();
  const displayName =
    provider.type === "clinic"
      ? (provider.clinicName ?? "Clinic")
      : [provider.firstName, provider.lastName].filter(Boolean).join(" ");
  const initials =
    provider.type === "clinic"
      ? displayName.charAt(0).toUpperCase()
      : `${provider.firstName?.charAt(0) ?? ""}${provider.lastName?.charAt(0) ?? ""}`.toUpperCase();
  const widgetLabel = provider.type === "clinic" ? "Clinic" : "Provider";
  const isAssignedToEveryone =
    provider.isForAccountOwner &&
    careMembers.length > 0 &&
    careMembers.every((member) =>
      provider.careMembers.some(
        (assignedMember) => assignedMember.id === member.id,
      ),
    );
  const assignedPeople = [
    provider.isForAccountOwner
      ? user?.firstName || "Account owner"
      : null,
    ...provider.careMembers.map((member) => member.firstName),
  ].filter((name): name is string => Boolean(name));
  const familyAssigneeLabel = isAssignedToEveryone
    ? "Everyone"
    : assignedPeople.length > 1
      ? `${assignedPeople[0]} +${assignedPeople.length - 1}`
      : assignedPeople[0] ?? null;
  const location = [provider.city, provider.state].filter(Boolean).join(", ");
  const hasDetails = Boolean(
    location || provider.zipCode || provider.phoneNumber,
  );
  const activeVisitSchedule =
    provider.visitSchedules.find((schedule) => schedule.isEnabled) ??
    (provider.visitSchedule?.isEnabled ? provider.visitSchedule : null);

  return (
    <HapticButton
      accessibilityLabel={`View ${displayName}`}
      accessibilityRole="button"
      onPress={() => {
        if (returnTo) {
          router.push({
            pathname: "/providers/[providerId]",
            params: {
              providerId: provider.id,
              returnTo,
            },
          });
          return;
        }

        router.push(`/providers/${provider.id}` as Href);
      }}
      style={({ pressed }) => [
        styles.card,
        variant === "full" ? styles.fullCard : null,
        pressed ? styles.cardPressed : null,
      ]}
    >
      <View style={styles.header}>
        {provider.imageUrl ? (
          <Image
            accessibilityLabel={displayName}
            contentFit="cover"
            contentPosition="top center"
            source={{ uri: provider.imageUrl }}
            style={[
              styles.avatarImage,
              variant === "full" ? styles.fullAvatar : null,
            ]}
          />
        ) : (
          <View
            style={[styles.avatar, variant === "full" ? styles.fullAvatar : null]}
          >
            <Text
              style={[
                styles.avatarText,
                variant === "full" ? styles.fullAvatarText : null,
              ]}
            >
              {initials}
            </Text>
          </View>
        )}

        <View style={styles.headingContent}>
          <View style={styles.labelRow}>
            <View style={styles.labelIdentity}>
              <Text style={styles.widgetLabel}>{widgetLabel}</Text>
              {activeVisitSchedule ? (
                <>
                  <Text style={styles.labelSeparator}>|</Text>
                  <View
                    accessibilityLabel={`Routine visit schedule active: ${formatRoutineMonths(activeVisitSchedule.annualMonths)}`}
                    accessible
                    style={styles.scheduleIndicator}
                  >
                    <Text
                      adjustsFontSizeToFit
                      ellipsizeMode="tail"
                      minimumFontScale={0.8}
                      numberOfLines={1}
                      style={styles.scheduleText}
                    >
                      Routine Visits Enabled
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
            <View style={styles.labelActions}>
              {familyAssigneeLabel ? (
                <View
                  accessibilityLabel={`For ${familyAssigneeLabel}`}
                  accessible
                  style={styles.assignee}
                >
                  <Image
                    contentFit="contain"
                    source={require("../../assets/people-roof-solid-full.svg")}
                    style={styles.assigneeIcon}
                  />
                  <Text numberOfLines={1} style={styles.assigneeText}>
                    For {familyAssigneeLabel}
                  </Text>
                </View>
              ) : null}
              {onDelete ? (
                <Pressable
                  accessibilityLabel={`Delete ${displayName}`}
                  onPress={(event) => {
                    event.stopPropagation();
                    onDelete();
                  }}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <Text
            numberOfLines={1}
            style={[
              styles.providerName,
              variant === "full" ? styles.fullProviderName : null,
            ]}
          >
            {displayName}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              styles.specialty,
              variant === "full" ? styles.fullSpecialty : null,
            ]}
          >
            {provider.specialty}
          </Text>
        </View>

      </View>

      {hasDetails ? (
        <View
          style={[styles.details, variant === "full" ? styles.fullDetails : null]}
        >
          {location || provider.zipCode ? (
            <View style={styles.detailGroup}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text
                style={[
                  styles.detailText,
                  variant === "full" ? styles.fullDetailText : null,
                ]}
              >
                {[location, provider.zipCode].filter(Boolean).join(" ")}
              </Text>
            </View>
          ) : null}

          {provider.phoneNumber ? (
            <View
              style={location || provider.zipCode ? styles.phoneGroup : null}
            >
              <Text style={styles.detailLabel}>Phone</Text>
              <Text
                style={[
                  styles.detailText,
                  variant === "full" ? styles.fullDetailText : null,
                ]}
              >
                {provider.phoneNumber}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </HapticButton>
  );
}

const shortMonthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function formatRoutineMonths(months: number[]): string {
  const monthLabels = months
    .map((month) => shortMonthNames[month - 1])
    .filter((month): month is (typeof shortMonthNames)[number] =>
      Boolean(month),
    );

  if (monthLabels.length <= 3) {
    return monthLabels.join(", ");
  }

  return `${monthLabels.length} months per year`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f8fafc",
    borderColor: "rgba(31, 53, 87, 0.08)",
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  fullCard: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(31, 53, 87, 0.14)",
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
  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "rgba(31, 53, 87, 0.15)",
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  avatarImage: {
    borderRadius: 8,
    height: 48,
    width: 48,
  },
  fullAvatar: {
    height: 60,
    width: 60,
  },
  avatarText: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: fontWeights.semibold,
  },
  fullAvatarText: {
    fontSize: 18,
  },
  headingContent: {
    flex: 1,
    minWidth: 0,
  },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  labelIdentity: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 6,
    minWidth: 0,
  },
  labelSeparator: {
    color: "#9aa6b5",
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: fontWeights.semibold,
  },
  labelActions: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: 10,
    marginLeft: 8,
    maxWidth: "38%",
    minWidth: 0,
  },
  widgetLabel: {
    color: colors.secondary,
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: fontWeights.semibold,
    textTransform: "uppercase",
  },
  assignee: {
    alignItems: "center",
    backgroundColor: "rgba(28, 184, 178, 0.1)",
    borderRadius: 5,
    flexDirection: "row",
    flexShrink: 1,
    gap: 4,
    maxWidth: 128,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  assigneeIcon: {
    height: 10,
    tintColor: "#39716f",
    width: 11,
  },
  assigneeText: {
    color: "#39716f",
    flexShrink: 1,
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  deleteText: {
    color: "#94a3b8",
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: fontWeights.semibold,
  },
  providerName: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 16,
    fontWeight: fontWeights.semibold,
    marginTop: 2,
  },
  fullProviderName: {
    fontSize: 19,
    marginTop: 4,
  },
  specialty: {
    color: "#334155",
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: fontWeights.medium,
    marginTop: 1,
  },
  fullSpecialty: {
    fontSize: 14,
    marginTop: 2,
  },
  scheduleIndicator: {
    alignItems: "center",
    flexShrink: 1,
    flexDirection: "row",
    minWidth: 0,
  },
  scheduleText: {
    color: "#39716f",
    flexShrink: 1,
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: fontWeights.bold,
    minWidth: 0,
  },
  details: {
    borderTopColor: "#f1f5f9",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
  },
  fullDetails: {
    marginTop: 16,
    paddingTop: 14,
  },
  detailGroup: {
    flex: 1,
    minWidth: 0,
  },
  phoneGroup: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  detailLabel: {
    color: "#94a3b8",
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: fontWeights.semibold,
    textTransform: "uppercase",
  },
  detailText: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 13,
    marginTop: 2,
  },
  fullDetailText: {
    fontSize: 14,
    marginTop: 4,
  },
});
