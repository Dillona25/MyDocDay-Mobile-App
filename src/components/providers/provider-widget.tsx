import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import type { Provider } from "@/types/provider";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

type ProviderWidgetProps = {
  provider: Provider;
  onDelete?: () => void;
};

export function ProviderWidget({ provider, onDelete }: ProviderWidgetProps) {
  const displayName =
    provider.type === "clinic"
      ? (provider.clinicName ?? "Clinic")
      : [provider.firstName, provider.lastName].filter(Boolean).join(" ");
  const initials =
    provider.type === "clinic"
      ? displayName.charAt(0).toUpperCase()
      : `${provider.firstName?.charAt(0) ?? ""}${provider.lastName?.charAt(0) ?? ""}`.toUpperCase();
  const widgetLabel = provider.type === "clinic" ? "Clinic" : "Provider";
  const location = [provider.city, provider.state].filter(Boolean).join(", ");
  const hasDetails = Boolean(location || provider.zipCode || provider.phoneNumber);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {provider.imageUrl ? (
          <Image
            accessibilityLabel={displayName}
            contentFit="cover"
            source={{ uri: provider.imageUrl }}
            style={styles.avatarImage}
          />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}

        <View style={styles.headingContent}>
          <View style={styles.labelRow}>
            <Text style={styles.widgetLabel}>{widgetLabel}</Text>
            {onDelete ? (
              <Pressable
                accessibilityLabel={`Delete ${displayName}`}
                onPress={onDelete}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            ) : null}
          </View>

          <Text numberOfLines={1} style={styles.providerName}>
            {displayName}
          </Text>
          <Text style={styles.specialty}>{provider.specialty}</Text>
        </View>
      </View>

      {hasDetails ? (
        <View style={styles.details}>
          {location || provider.zipCode ? (
            <View style={styles.detailGroup}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailText}>
                {[location, provider.zipCode].filter(Boolean).join(" ")}
              </Text>
            </View>
          ) : null}

          {provider.phoneNumber ? (
            <View style={location || provider.zipCode ? styles.phoneGroup : null}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailText}>{provider.phoneNumber}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f8fafc",
    borderColor: "rgba(31, 53, 87, 0.4)",
    borderRadius: 8,
    borderWidth: 1,
    padding: 20,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.1,
    shadowRadius: 28,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 16,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "rgba(31, 53, 87, 0.15)",
    borderRadius: 8,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  avatarImage: {
    borderRadius: 8,
    height: 64,
    width: 64,
  },
  avatarText: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 18,
    fontWeight: fontWeights.semibold,
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
  widgetLabel: {
    color: colors.secondary,
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: fontWeights.semibold,
    textTransform: "uppercase",
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
    fontSize: 18,
    fontWeight: fontWeights.semibold,
    marginTop: 4,
  },
  specialty: {
    color: "#334155",
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: fontWeights.medium,
    marginTop: 2,
  },
  details: {
    borderTopColor: "#f1f5f9",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginTop: 20,
    paddingTop: 16,
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
    fontSize: 12,
    fontWeight: fontWeights.semibold,
    textTransform: "uppercase",
  },
  detailText: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: 4,
  },
});
