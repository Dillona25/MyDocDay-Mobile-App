import { openLocationInMaps } from "@/api/appointments/maps";
import { formatProviderLocation } from "@/api/providers/provider-location";
import { HapticButton } from "@/components/common/HapticButton";
import { useAppointments } from "@/hooks/useAppointments";
import { useProviders } from "@/hooks/useProviders";
import { useToast } from "@/store/ToastContext";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import type { Appointment } from "@/types/appointment";
import { Image } from "expo-image";
import { router, type Href, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

function getAppointmentDateTime(appointment: Appointment) {
  const [year, month, day] = appointment.date.slice(0, 10).split("-").map(Number);
  const [hours = 0, minutes = 0] = appointment.startTime
    .split(":")
    .map(Number);

  return new Date(year, month - 1, day, hours, minutes);
}

function formatAppointmentDate(date: string) {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);

  if (!year || !month || !day) {
    return date;
  }

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatAppointmentTime(startTime: string) {
  const [hours, minutes] = startTime.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return startTime;
  }

  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AppointmentDetailsScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const numericAppointmentId = Number(appointmentId);
  const { appointments, aptError, isLoadingApt } = useAppointments();
  const { providers } = useProviders();
  const { showToast } = useToast();
  const appointment = appointments.find(
    (appointmentItem) => appointmentItem.id === numericAppointmentId,
  );
  const linkedProvider = providers.find(
    (provider) => provider.id === appointment?.providerId,
  );
  const location =
    appointment?.location ||
    (linkedProvider ? formatProviderLocation(linkedProvider) : null);

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

  if (aptError || !appointment) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centeredState}>
          <Text style={styles.stateTitle}>Appointment not available</Text>
          <Text style={styles.stateText}>
            {aptError || "This appointment could not be found in your schedule."}
          </Text>
          <HapticButton
            onPress={() => router.replace("/appointments")}
            style={styles.returnButton}
          >
            <Text style={styles.returnButtonText}>Return to appointments</Text>
          </HapticButton>
        </View>
      </SafeAreaView>
    );
  }

  const appointmentTypeLabel =
    appointment.appointmentType === "telehealth" ? "Telehealth" : "In Person";
  const appointmentTypeIcon =
    appointment.appointmentType === "telehealth"
      ? require("../../../assets/video-solid-full.svg")
      : require("../../../assets/hospital-solid-full.svg");
  const providerLabel =
    appointment.providerType === "clinic" ? "Clinic" : "Provider";
  const isPast = getAppointmentDateTime(appointment) < new Date();

  async function handleOpenInMaps() {
    if (!location) {
      return;
    }

    try {
      await openLocationInMaps(location);
    } catch {
      showToast("Unable to open this location in Maps.", "error");
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.identitySection}>
          <View style={styles.iconFrame}>
            <Image
              accessibilityLabel={appointmentTypeLabel}
              contentFit="contain"
              source={appointmentTypeIcon}
              style={styles.appointmentIcon}
            />
          </View>

          <Text
            style={[styles.status, isPast ? styles.statusPast : null]}
          >
            {isPast ? "Past appointment" : "Upcoming appointment"}
          </Text>
          <Text style={styles.title}>{appointment.title}</Text>
          <Text style={styles.type}>{appointmentTypeLabel}</Text>
        </View>

        <View style={styles.actionRow}>
          <HapticButton
            onPress={() =>
              router.push(`/appointments/${numericAppointmentId}/edit` as Href)
            }
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>Edit Appointment</Text>
          </HapticButton>
          {location ? (
            <HapticButton
              accessibilityLabel="Open appointment location in Maps"
              onPress={handleOpenInMaps}
              style={styles.mapsButton}
            >
              <Text style={styles.mapsButtonText}>Open in Maps</Text>
              <Image
                contentFit="contain"
                source={require("../../../assets/arrow-up-right-from-square-solid-full.svg")}
                style={styles.mapsIcon}
              />
            </HapticButton>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Visit details</Text>
          <Text style={styles.sectionTitle}>Appointment information</Text>

          <View style={styles.detailList}>
            <DetailRow
              label="Date"
              value={formatAppointmentDate(appointment.date)}
            />
            <DetailRow
              label="Start time"
              value={formatAppointmentTime(appointment.startTime)}
            />
            <DetailRow label="Appointment type" value={appointmentTypeLabel} />
            {appointment.doctorName ? (
              <DetailRow label={providerLabel} value={appointment.doctorName} />
            ) : null}
            {location ? (
              <DetailRow label="Location" value={location} />
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f4f7fa",
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  identitySection: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  iconFrame: {
    alignItems: "center",
    backgroundColor: "rgba(28, 184, 178, 0.12)",
    borderColor: "rgba(28, 184, 178, 0.3)",
    borderRadius: 8,
    borderWidth: 1,
    height: 92,
    justifyContent: "center",
    width: 92,
  },
  appointmentIcon: {
    height: 36,
    tintColor: colors.primary,
    width: 36,
  },
  status: {
    color: colors.secondary,
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: fontWeights.bold,
    marginTop: 14,
    textTransform: "uppercase",
  },
  statusPast: {
    color: "#7b8798",
  },
  title: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 26,
    fontWeight: fontWeights.bold,
    marginTop: 4,
    textAlign: "center",
  },
  type: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 15,
    marginTop: 4,
  },
  actionRow: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 24,
    paddingTop: 22,
  },
  editButton: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 48,
    width: "100%",
  },
  editButtonText: {
    color: "#ffffff",
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: fontWeights.semibold,
  },
  mapsButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 10,
  },
  mapsButtonText: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: fontWeights.semibold,
  },
  mapsIcon: {
    height: 12,
    tintColor: colors.primary,
    width: 12,
  },
  section: {
    borderTopColor: "rgba(31, 53, 87, 0.08)",
    borderTopWidth: 1,
    marginTop: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionEyebrow: {
    color: colors.secondary,
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: fontWeights.bold,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 20,
    fontWeight: fontWeights.semibold,
    marginTop: 3,
  },
  detailList: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(31, 53, 87, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
    paddingHorizontal: 16,
  },
  detailRow: {
    borderBottomColor: "rgba(31, 53, 87, 0.08)",
    borderBottomWidth: 1,
    gap: 4,
    paddingVertical: 14,
  },
  detailLabel: {
    color: "#7b8798",
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: fontWeights.semibold,
    textTransform: "uppercase",
  },
  detailValue: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
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
