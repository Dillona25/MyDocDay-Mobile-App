import { HapticButton } from "@/components/common/HapticButton";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

type CareTaskCardProps = {
  careMemberName?: string;
  title: string;
  dueDate: string;
  dueLabel: string;
  notes?: string;
  provider?: string;
  dueTone: "safe" | "warning" | "urgent";
  isCompleting?: boolean;
  onComplete?: () => void;
  onPress?: () => void;
  timeLabel?: string;
};

export function CareTaskCard({
  careMemberName,
  title,
  dueDate,
  dueLabel,
  notes,
  provider,
  dueTone,
  isCompleting = false,
  onComplete,
  onPress,
  timeLabel,
}: CareTaskCardProps) {
  const [year, month, day] = dueDate.slice(0, 10).split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    <HapticButton
      accessibilityLabel={`Edit ${title} reminder`}
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        dueTone === "safe" ? styles.cardSafe : null,
        dueTone === "warning" ? styles.cardWarning : null,
        dueTone === "urgent" ? styles.cardUrgent : null,
        pressed ? styles.cardPressed : null,
      ]}
    >
      <HapticButton
        accessibilityLabel={`Mark ${title} complete`}
        accessibilityRole="checkbox"
        disabled={!onComplete || isCompleting}
        onPress={(event) => {
          event.stopPropagation();
          onComplete?.();
        }}
        style={[
          styles.completionButton,
          isCompleting ? styles.completionButtonPending : null,
        ]}
      >
        <View
          style={[
            styles.completionDot,
            isCompleting ? styles.completionDotPending : null,
          ]}
        />
      </HapticButton>

      <View style={styles.dateBlock}>
        <Text style={styles.dateMonth}>
          {date.toLocaleDateString("en-US", { month: "short" })}
        </Text>
        <Text style={styles.dateDay}>{day}</Text>
        <Text style={styles.dateYear}>{year}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.titleGroup}>
          <Text numberOfLines={2} style={styles.title}>
            {title}
          </Text>
          <View style={styles.titleActions}>
            {careMemberName ? (
              <View
                accessibilityLabel={`For ${careMemberName}`}
                accessible
                style={styles.assignee}
              >
                <Image
                  contentFit="contain"
                  source={require("../../assets/people-roof-solid-full.svg")}
                  style={styles.assigneeIcon}
                />
                <Text ellipsizeMode="tail" numberOfLines={1} style={styles.assigneeText}>
                  For {careMemberName}
                </Text>
              </View>
            ) : null}
            <View
              style={[
                styles.dueBadge,
                dueTone === "safe" ? styles.dueBadgeSafe : null,
                dueTone === "warning" ? styles.dueBadgeWarning : null,
                dueTone === "urgent" ? styles.dueBadgeUrgent : null,
              ]}
            >
              <Text
                style={[
                  styles.dueText,
                  dueTone === "safe" ? styles.dueTextSafe : null,
                  dueTone === "warning" ? styles.dueTextWarning : null,
                  dueTone === "urgent" ? styles.dueTextUrgent : null,
                ]}
              >
                {dueLabel}
              </Text>
            </View>
          </View>
        </View>

        {notes ? (
          <Text numberOfLines={2} style={styles.notes}>
            {notes}
          </Text>
        ) : null}

        {timeLabel ? (
          <View style={styles.timeRow}>
            <Image
              contentFit="contain"
              source={require("../../assets/calendar-solid-full.svg")}
              style={styles.metaIcon}
            />
            <Text style={styles.metaText}>{timeLabel}</Text>
          </View>
        ) : null}

        {provider ? (
          <View style={styles.providerRow}>
            <Image
              contentFit="contain"
              source={require("../../assets/user-doctor-solid-full.svg")}
              style={styles.metaIcon}
            />
            <Text numberOfLines={1} style={styles.metaText}>
              {provider}
            </Text>
          </View>
        ) : null}
      </View>
    </HapticButton>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "flex-start",
    backgroundColor: "#ffffff",
    borderColor: "rgba(31, 53, 87, 0.12)",
    borderLeftColor: colors.secondary,
    borderLeftWidth: 3,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 15,
  },
  cardUrgent: {
    borderLeftColor: "#c94b4b",
  },
  cardSafe: {
    borderLeftColor: "#2f7d57",
  },
  cardWarning: {
    borderLeftColor: "#c48b17",
  },
  cardPressed: {
    opacity: 0.82,
  },
  completionButton: {
    alignItems: "center",
    borderColor: "#9ba8b9",
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    marginTop: 2,
    width: 24,
  },
  completionButtonPending: {
    opacity: 0.45,
  },
  completionDot: {
    backgroundColor: "transparent",
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  completionDotPending: {
    backgroundColor: colors.secondary,
  },
  dateBlock: {
    alignSelf: "flex-start",
    alignItems: "center",
    backgroundColor: "#f4f7fa",
    borderColor: "rgba(31, 53, 87, 0.1)",
    borderRadius: 7,
    borderWidth: 1,
    justifyContent: "center",
    height: 62,
    width: 48,
  },
  dateMonth: {
    color: colors.secondary,
    fontFamily: fonts.body,
    fontSize: 9,
    fontWeight: fontWeights.bold,
    textTransform: "uppercase",
  },
  dateDay: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 19,
    fontWeight: fontWeights.bold,
    lineHeight: 22,
  },
  dateYear: {
    color: "#7b8798",
    fontFamily: fonts.body,
    fontSize: 8,
    fontWeight: fontWeights.medium,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  titleGroup: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 7,
    justifyContent: "space-between",
  },
  title: {
    color: colors.primary,
    flex: 1,
    fontFamily: fonts.heading,
    fontSize: 15,
    fontWeight: fontWeights.semibold,
    lineHeight: 21,
  },
  dueBadge: {
    borderRadius: 5,
    paddingHorizontal: 8,
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
    fontSize: 10,
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
  notes: {
    color: "#677488",
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  titleActions: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: 6,
    maxWidth: "58%",
  },
  assignee: {
    alignItems: "center",
    backgroundColor: "rgba(28, 184, 178, 0.1)",
    borderRadius: 5,
    flexDirection: "row",
    flexShrink: 1,
    gap: 4,
    maxWidth: 86,
    minWidth: 0,
    paddingHorizontal: 6,
    paddingVertical: 4,
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
    minWidth: 0,
  },
  providerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
  },
  timeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
  },
  metaIcon: {
    height: 12,
    tintColor: "#7b8798",
    width: 12,
  },
  metaText: {
    color: "#7b8798",
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: fontWeights.medium,
  },
});
