import { formatProviderLocation } from "@/api/providers/provider-location";
import { useProviders } from "@/hooks/useProviders";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import type { Appointment } from "@/types/appointment";
import { Image } from "expo-image";
import { router, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { HapticButton } from "../common/HapticButton";

type AppointmentCardProps = {
  appointment: Appointment;
  onDelete?: () => void;
  returnTo?: string;
  variant?: "compact" | "full";
};

function formatAppointmentDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);

  if (!year || !month || !day) {
    return date;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatAppointmentTime(startTime: string): string {
  const [hours, minutes] = startTime.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return startTime;
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2000, 0, 1, hours, minutes));
}

export function AppointmentCard({
  appointment,
  onDelete,
  returnTo,
  variant = "full",
}: AppointmentCardProps) {
  const { providers } = useProviders();
  const linkedProvider = providers.find(
    (provider) => provider.id === appointment.providerId,
  );
  const location =
    appointment.location ||
    (linkedProvider ? formatProviderLocation(linkedProvider) : null);
  const appointmentTypeLabel =
    appointment.appointmentType === "telehealth" ? "Telehealth" : "In Person";
  const providerLabel =
    appointment.providerType === "clinic" ? "Clinic" : "Provider";
  const appointmentTypeIcon =
    appointment.appointmentType === "telehealth"
      ? require("../../assets/video-solid-full.svg")
      : require("../../assets/hospital-solid-full.svg");

  function openAppointment() {
    if (returnTo) {
      router.push({
        pathname: "/appointments/[appointmentId]",
        params: {
          appointmentId: appointment.id,
          returnTo,
        },
      });
      return;
    }

    router.push(`/appointments/${appointment.id}` as Href);
  }

  if (variant === "compact") {
    return (
      <HapticButton
        accessibilityLabel={`View ${appointment.title}`}
        accessibilityRole="button"
        onPress={openAppointment}
        style={({ pressed }) => [
          styles.compactCard,
          pressed ? styles.cardPressed : null,
        ]}
      >
        <View style={styles.compactIconFrame}>
          <Image
            contentFit="contain"
            source={appointmentTypeIcon}
            style={styles.compactIcon}
          />
        </View>

        <View style={styles.compactContent}>
          <View style={styles.compactTitleRow}>
            <Text numberOfLines={1} style={styles.compactTitle}>
              {appointment.title}
            </Text>
            <Text style={styles.compactTime}>
              {formatAppointmentTime(appointment.startTime)}
            </Text>
          </View>

          <Text numberOfLines={1} style={styles.compactMeta}>
            {[appointmentTypeLabel, appointment.doctorName]
              .filter(Boolean)
              .join(" • ")}
          </Text>
        </View>

      </HapticButton>
    );
  }

  return (
    <HapticButton
      accessibilityLabel={`View ${appointment.title}`}
      accessibilityRole="button"
      onPress={openAppointment}
      style={({ pressed }) => [
        styles.card,
        pressed ? styles.cardPressed : null,
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.widgetLabel}>Appointment</Text>
        {onDelete ? (
          <Pressable
            accessibilityLabel={`Delete ${appointment.title}`}
            onPress={(event) => {
              event.stopPropagation();
              onDelete();
            }}
          >
            <Text style={styles.deleteText}>Delete</Text>
          </Pressable>
        ) : null}
      </View>

      <Text numberOfLines={1} style={styles.title}>
        {appointment.title}
      </Text>

      <View style={styles.typeRow}>
        <Image
          contentFit="contain"
          source={appointmentTypeIcon}
          style={styles.typeIcon}
        />
        <Text style={styles.typeText}>{appointmentTypeLabel}</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.detailGroup}>
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailText}>
            {formatAppointmentDate(appointment.date)}
          </Text>
        </View>

        <View style={styles.timeGroup}>
          <Text style={styles.detailLabel}>Time</Text>
          <Text style={styles.detailText}>
            {formatAppointmentTime(appointment.startTime)}
          </Text>
        </View>
      </View>

      {appointment.doctorName ? (
        <View style={styles.providerSection}>
          <Text style={styles.detailLabel}>{providerLabel}</Text>
          <Text numberOfLines={1} style={styles.detailText}>
            {appointment.doctorName}
          </Text>
        </View>
      ) : null}

      {location ? (
        <View style={styles.locationSection}>
          <Text style={styles.detailLabel}>Location</Text>
          <Text numberOfLines={2} style={styles.locationText}>
            {location}
          </Text>
        </View>
      ) : null}
    </HapticButton>
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
  cardPressed: {
    opacity: 0.82,
  },
  compactCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "rgba(31, 53, 87, 0.12)",
    borderLeftColor: colors.secondary,
    borderLeftWidth: 3,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  compactIconFrame: {
    alignItems: "center",
    backgroundColor: "rgba(31, 53, 87, 0.1)",
    borderRadius: 8,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  compactIcon: {
    height: 17,
    tintColor: colors.primary,
    width: 17,
  },
  compactContent: {
    flex: 1,
    minWidth: 0,
  },
  compactTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  compactTitle: {
    color: colors.primary,
    flex: 1,
    fontFamily: fonts.heading,
    fontSize: 15,
    fontWeight: fontWeights.semibold,
  },
  compactTime: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: fontWeights.semibold,
  },
  compactMeta: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 13,
    marginTop: 3,
  },
  header: {
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
  title: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 18,
    fontWeight: fontWeights.semibold,
    marginTop: 4,
  },
  typeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  typeIcon: {
    height: 13,
    tintColor: colors.primary,
    width: 13,
  },
  typeText: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: fontWeights.semibold,
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
  timeGroup: {
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
  providerSection: {
    borderTopColor: "#f1f5f9",
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 16,
  },
  locationSection: {
    borderTopColor: "#f1f5f9",
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 16,
  },
  locationText: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
});
