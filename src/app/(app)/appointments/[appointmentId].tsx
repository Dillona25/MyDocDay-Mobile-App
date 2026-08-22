import { addAppointmentToCalendar } from "@/api/appointments/calendar";
import { openLocationInMaps } from "@/api/appointments/maps";
import { formatProviderLocation } from "@/api/providers/provider-location";
import { BackButton } from "@/components/common/BackButton";
import { HapticButton } from "@/components/common/HapticButton";
import { useAppointments } from "@/hooks/useAppointments";
import { useCareMembers } from "@/hooks/useCareMembers";
import { useProviders } from "@/hooks/useProviders";
import { useToast } from "@/store/ToastContext";
import { useAuth } from "@/store/auth/AuthContext";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import type { Appointment } from "@/types/appointment";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

function getAppointmentDateTime(appointment: Appointment) {
  const [year, month, day] = appointment.date
    .slice(0, 10)
    .split("-")
    .map(Number);
  const [hours = 0, minutes = 0] = appointment.startTime.split(":").map(Number);

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

function formatRecurrence(appointment: Appointment) {
  if (appointment.recurrenceStatus === "not_recurring") {
    return "This care does not repeat";
  }
  if (appointment.recurrenceStatus === "unsure" || !appointment.recurrence) {
    return "Not sure yet";
  }

  const { intervalValue, intervalUnit } = appointment.recurrence;
  const unit = intervalValue === 1 ? intervalUnit.slice(0, -1) : intervalUnit;
  return `Every ${intervalValue} ${unit}`;
}

function formatReminderLead(days: number | null) {
  if (days === null) return "No scheduling lead time saved";
  if (days === 14) return "2 weeks before";
  if (days === 30) return "1 month before";
  if (days === 60) return "2 months before";
  return `${days} days before`;
}

export default function AppointmentDetailsScreen() {
  const { appointmentId, returnTo } = useLocalSearchParams<{
    appointmentId: string;
    returnTo?: string;
  }>();
  const numericAppointmentId = Number(appointmentId);
  const appointmentReturnHref =
    returnTo?.startsWith("/family/")
      ? (returnTo as Href)
      : returnTo === "/dashboard"
        ? ("/dashboard" as Href)
        : ("/appointments" as Href);
  const { appointments, aptError, isLoadingApt } = useAppointments();
  const { careMembers } = useCareMembers();
  const { providers } = useProviders();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isOpeningCalendar, setIsOpeningCalendar] = useState(false);
  const appointment = appointments.find(
    (appointmentItem) => appointmentItem.id === numericAppointmentId,
  );
  const assignedCareMember =
    appointment?.careMember ??
    careMembers.find((member) => member.id === appointment?.careMemberId);
  const assigneeName =
    assignedCareMember?.firstName || user?.firstName || "Account owner";
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
            {aptError ||
              "This appointment could not be found in your schedule."}
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
  const calendarAppointment = appointment;
  const appointmentProvider = providers.find(
    (provider) => provider.id === appointment.providerId,
  );

  async function openCalendarComposer() {
    try {
      setIsOpeningCalendar(true);
      await addAppointmentToCalendar(calendarAppointment, appointmentProvider);
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(
        error instanceof Error
          ? error.message
          : "Unable to open your device calendar",
        "error",
      );
    } finally {
      setIsOpeningCalendar(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.backNavigation}>
          <BackButton
            href={appointmentReturnHref}
            navigationMode={returnTo ? "navigate" : "dismiss"}
          />
        </View>
        <View style={styles.identitySection}>
          <View style={styles.iconFrame}>
            <Image
              accessibilityLabel={appointmentTypeLabel}
              contentFit="contain"
              source={appointmentTypeIcon}
              style={styles.appointmentIcon}
            />
          </View>

          <Text style={[styles.status, isPast ? styles.statusPast : null]}>
            {isPast ? "Past appointment" : "Upcoming appointment"}
          </Text>
          <Text style={styles.title}>{appointment.title}</Text>
          <Text style={styles.type}>{appointmentTypeLabel}</Text>
          <View style={styles.assigneeChip}>
            <Image
              contentFit="contain"
              source={require("../../../assets/people-roof-solid-full.svg")}
              style={styles.assigneeIcon}
            />
            <Text style={styles.assigneeText}>For {assigneeName}</Text>
          </View>
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
          <HapticButton
            disabled={isOpeningCalendar}
            onPress={openCalendarComposer}
            style={styles.calendarButton}
          >
            <Text style={styles.calendarButtonText}>
              {isOpeningCalendar ? "Opening Calendar..." : "Add to Calendar"}
            </Text>
            <Image
              contentFit="contain"
              source={require("../../../assets/arrow-up-right-from-square-solid-full.svg")}
              style={styles.calendarButtonIcon}
            />
          </HapticButton>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Visit details</Text>
          <Text style={styles.sectionTitle}>Appointment information</Text>

          <View style={styles.detailList}>
            <DetailRow label="For" value={assigneeName} />
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
            {location ? <DetailRow label="Location" value={location} /> : null}
            <DetailRow label="Ongoing care" value={formatRecurrence(appointment)} />
            {appointment.recurrence ? (
              <DetailRow
                label="Schedule reminder"
                value={formatReminderLead(
                  appointment.recurrence.reminderLeadDays,
                )}
              />
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
  backNavigation: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  identitySection: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
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
  assigneeChip: {
    alignItems: "center",
    backgroundColor: "rgba(28, 184, 178, 0.1)",
    borderRadius: 6,
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  assigneeIcon: {
    height: 12,
    tintColor: "#39716f",
    width: 13,
  },
  assigneeText: {
    color: "#39716f",
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: fontWeights.bold,
  },
  actionRow: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 22,
  },
  editButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
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
  calendarButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 12,
  },
  calendarButtonText: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: fontWeights.semibold,
  },
  calendarButtonIcon: {
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
