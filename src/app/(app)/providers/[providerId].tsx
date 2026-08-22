import { AppointmentCard } from "@/components/appointments/appointment-card";
import { BackButton } from "@/components/common/BackButton";
import { HapticButton } from "@/components/common/HapticButton";
import { useAppointments } from "@/hooks/useAppointments";
import { useProviders } from "@/hooks/useProviders";
import { useAuth } from "@/store/auth/AuthContext";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import type { Appointment } from "@/types/appointment";
import type { ProviderVisitSchedule } from "@/types/provider";
import { Image } from "expo-image";
import { router, type Href, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type AppointmentFilter = "upcoming" | "past";

const appointmentFilters: {
  label: string;
  value: AppointmentFilter;
}[] = [
  { label: "Upcoming", value: "upcoming" },
  { label: "Past", value: "past" },
];

const MAX_VISIBLE_APPOINTMENTS = 4;

function getAppointmentDateTime(appointment: Appointment) {
  const [year, month, day] = appointment.date.slice(0, 10).split("-").map(Number);
  const [hours = 0, minutes = 0] = appointment.startTime
    .split(":")
    .map(Number);

  return new Date(year, month - 1, day, hours, minutes);
}

export default function ProviderDetailsScreen() {
  const { user } = useAuth();
  const { providerId, returnTo } = useLocalSearchParams<{
    providerId: string;
    returnTo?: string;
  }>();
  const numericProviderId = Number(providerId);
  const providerReturnHref =
    returnTo?.startsWith("/family/")
      ? (returnTo as Href)
      : returnTo === "/dashboard"
        ? ("/dashboard" as Href)
        : ("/providers" as Href);
  const { error, isLoading, providers } = useProviders();
  const {
    appointments,
    aptError,
    isLoadingApt,
  } = useAppointments();
  const provider = providers.find(
    (providerItem) => providerItem.id === numericProviderId,
  );
  const [activeAppointmentFilter, setActiveAppointmentFilter] =
    useState<AppointmentFilter>("upcoming");
  const [selectedPastYear, setSelectedPastYear] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);

    return () => clearInterval(interval);
  }, []);

  const { pastAppointments, upcomingAppointments } = useMemo(() => {
    const providerAppointments = appointments.filter(
      (appointment) => appointment.providerId === numericProviderId,
    );

    return {
      upcomingAppointments: providerAppointments
        .filter(
          (appointment) => getAppointmentDateTime(appointment) >= currentTime,
        )
        .sort(
          (first, second) =>
            getAppointmentDateTime(first).getTime() -
            getAppointmentDateTime(second).getTime(),
        ),
      pastAppointments: providerAppointments
        .filter(
          (appointment) => getAppointmentDateTime(appointment) < currentTime,
        )
        .sort(
          (first, second) =>
            getAppointmentDateTime(second).getTime() -
            getAppointmentDateTime(first).getTime(),
        ),
    };
  }, [appointments, currentTime, numericProviderId]);

  const pastYears = useMemo(
    () =>
      Array.from(
        new Set(
          pastAppointments.map((appointment) =>
            getAppointmentDateTime(appointment).getFullYear(),
          ),
        ),
      ).sort((first, second) => second - first),
    [pastAppointments],
  );

  const filteredPastAppointments = useMemo(
    () =>
      selectedPastYear === null
        ? pastAppointments
        : pastAppointments.filter(
            (appointment) =>
              getAppointmentDateTime(appointment).getFullYear() ===
              selectedPastYear,
          ),
    [pastAppointments, selectedPastYear],
  );

  useEffect(() => {
    if (
      pastAppointments.length === 0 &&
      activeAppointmentFilter === "past"
    ) {
      setActiveAppointmentFilter("upcoming");
      setSelectedPastYear(null);
    }
  }, [activeAppointmentFilter, pastAppointments.length]);

  const visibleAppointments =
    activeAppointmentFilter === "upcoming"
      ? upcomingAppointments
      : filteredPastAppointments;
  const appointmentPreview = visibleAppointments.slice(
    0,
    MAX_VISIBLE_APPOINTMENTS,
  );
  const hasMoreAppointments =
    visibleAppointments.length > MAX_VISIBLE_APPOINTMENTS;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centeredState}>
          <ActivityIndicator color={colors.secondary} />
          <Text style={styles.stateText}>Loading provider...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !provider) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centeredState}>
          <Text style={styles.stateTitle}>Provider not available</Text>
          <Text style={styles.stateText}>
            {error || "This provider could not be found in your care team."}
          </Text>
          <HapticButton
            onPress={() => router.dismissTo("/providers")}
            style={styles.returnButton}
          >
            <Text style={styles.returnButtonText}>Return to providers</Text>
          </HapticButton>
        </View>
      </SafeAreaView>
    );
  }

  const displayName =
    provider.type === "clinic"
      ? (provider.clinicName ?? "Clinic")
      : [provider.firstName, provider.lastName].filter(Boolean).join(" ");
  const initials =
    provider.type === "clinic"
      ? displayName.charAt(0).toUpperCase()
      : `${provider.firstName?.charAt(0) ?? ""}${provider.lastName?.charAt(0) ?? ""}`.toUpperCase();
  const providerTypeLabel = provider.type === "clinic" ? "Clinic" : "Provider";
  const addressLine = [provider.streetAddress, provider.city]
    .filter(Boolean)
    .join(", ");
  const regionLine = [provider.state, provider.zipCode]
    .filter(Boolean)
    .join(" ");
  const upcomingCount = upcomingAppointments.length;
  const pastCount = pastAppointments.length;
  const providerAssignees = [
    provider.isForAccountOwner
      ? user?.firstName || "Account owner"
      : null,
    ...provider.careMembers.map((member) => member.firstName),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.backNavigation}>
          <BackButton
            href={providerReturnHref}
            navigationMode={returnTo ? "navigate" : "dismiss"}
          />
        </View>
        <View style={styles.identitySection}>
          {provider.imageUrl ? (
            <Image
              accessibilityLabel={displayName}
              contentFit="cover"
              source={{ uri: provider.imageUrl }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}

          <Text style={styles.providerType}>{providerTypeLabel}</Text>
          <Text style={styles.providerName}>{displayName}</Text>
          <Text style={styles.specialty}>{provider.specialty}</Text>
        </View>

        <View style={styles.actionRow}>
          <HapticButton
            onPress={() =>
              router.push(`/providers/${numericProviderId}/edit` as Href)
            }
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>Edit {providerTypeLabel}</Text>
          </HapticButton>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Care team details</Text>
          <Text style={styles.sectionTitle}>{providerTypeLabel} information</Text>

          {provider.visitSchedule ? (
            <VisitScheduleSummary schedule={provider.visitSchedule} />
          ) : null}

          <View style={styles.detailList}>
            <DetailRow label="For" value={providerAssignees} />
            <DetailRow label="Specialty" value={provider.specialty} />
            {provider.phoneNumber ? (
              <PhoneDetailRow phoneNumber={provider.phoneNumber} />
            ) : null}
            <DetailRow
              label="Address"
              value={[addressLine, regionLine].filter(Boolean).join("\n")}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.appointmentHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>Care history</Text>
              <Text style={styles.sectionTitle}>Appointments</Text>
            </View>
            <Text style={styles.appointmentSummary}>
              {upcomingCount} upcoming | {pastCount} past
            </Text>
          </View>

          {pastAppointments.length > 0 ? (
            <View style={styles.appointmentFilterRow}>
              {appointmentFilters.map((filter) => {
                const isActive = activeAppointmentFilter === filter.value;

                return (
                  <HapticButton
                    key={filter.value}
                    onPress={() => setActiveAppointmentFilter(filter.value)}
                    style={[
                      styles.appointmentFilterButton,
                      isActive ? styles.appointmentFilterButtonActive : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.appointmentFilterText,
                        isActive ? styles.appointmentFilterTextActive : null,
                      ]}
                    >
                      {filter.label}
                    </Text>
                  </HapticButton>
                );
              })}
            </View>
          ) : null}

          {activeAppointmentFilter === "past" && pastYears.length > 0 ? (
            <ScrollView
              contentContainerStyle={styles.yearFilterRow}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <HapticButton
                onPress={() => setSelectedPastYear(null)}
                style={[
                  styles.yearButton,
                  selectedPastYear === null ? styles.yearButtonActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.yearButtonText,
                    selectedPastYear === null
                      ? styles.yearButtonTextActive
                      : null,
                  ]}
                >
                  Any year
                </Text>
              </HapticButton>

              {pastYears.map((year) => {
                const isActive = selectedPastYear === year;

                return (
                  <HapticButton
                    key={year}
                    onPress={() => setSelectedPastYear(year)}
                    style={[
                      styles.yearButton,
                      isActive ? styles.yearButtonActive : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.yearButtonText,
                        isActive ? styles.yearButtonTextActive : null,
                      ]}
                    >
                      {year}
                    </Text>
                  </HapticButton>
                );
              })}
            </ScrollView>
          ) : null}

          {isLoadingApt ? (
            <Text style={styles.appointmentHelper}>Loading appointments...</Text>
          ) : null}
          {aptError ? (
            <Text style={styles.appointmentError}>{aptError}</Text>
          ) : null}
          {!isLoadingApt && !aptError && visibleAppointments.length === 0 ? (
            <Text style={styles.appointmentHelper}>
              {activeAppointmentFilter === "upcoming"
                ? `No upcoming appointments are connected to this ${providerTypeLabel.toLowerCase()} yet.`
                : selectedPastYear
                  ? `No past appointments were found for ${selectedPastYear}.`
                  : `No past appointments are connected to this ${providerTypeLabel.toLowerCase()} yet.`}
            </Text>
          ) : null}

          <View style={styles.appointmentList}>
            {appointmentPreview.map((appointment) => (
              <AppointmentCard
                appointment={appointment}
                key={appointment.id}
                variant="compact"
              />
            ))}
          </View>

          {hasMoreAppointments ? (
            <HapticButton
              onPress={() => router.push("/appointments")}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllButtonText}>
                View all appointments
              </Text>
            </HapticButton>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  if (!value) {
    return null;
  }

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function PhoneDetailRow({ phoneNumber }: { phoneNumber: string }) {
  const callablePhoneNumber = phoneNumber.replace(/[^\d+]/g, "");

  return (
    <View style={styles.detailRow}>
      <View style={styles.phoneRow}>
        <Text style={styles.detailLabel}>Phone</Text>
        <HapticButton
          accessibilityLabel={`Call ${phoneNumber}`}
          accessibilityRole="link"
          onPress={() => Linking.openURL(`tel:${callablePhoneNumber}`)}
          style={styles.callLink}
        >
          <Image
            contentFit="contain"
            source={require("../../../assets/phone-solid-full.svg")}
            style={styles.callIcon}
          />
          <Text style={styles.callLinkText}>Click to call</Text>
        </HapticButton>
      </View>
      <Text style={styles.detailValue}>{phoneNumber}</Text>
    </View>
  );
}

function VisitScheduleSummary({
  schedule,
}: {
  schedule: ProviderVisitSchedule;
}) {
  const { user } = useAuth();
  const monthSummary = formatMonthList(schedule.annualMonths);
  const appointmentStatus = getAppointmentStatusLabel(
    schedule.nextAppointmentStatus,
  );
  const scheduleOwner = schedule.careMember
    ? schedule.careMember.firstName
    : user?.firstName || "Account owner";

  return (
    <View style={styles.scheduleSummary}>
      <View style={styles.scheduleHeader}>
        <View style={styles.scheduleIconFrame}>
          <Image
            contentFit="contain"
            source={require("../../../assets/calendar-solid-full.svg")}
            style={styles.scheduleIcon}
          />
        </View>
        <View style={styles.scheduleHeadingGroup}>
          <Text style={styles.scheduleEyebrow}>Visit schedule saved</Text>
          <Text style={styles.scheduleHeadline}>
            Usually {monthSummary}
          </Text>
        </View>
        <View style={styles.scheduleStatus}>
          <View
            style={[
              styles.scheduleStatusDot,
              !schedule.isEnabled ? styles.scheduleStatusDotPaused : null,
            ]}
          />
          <Text style={styles.scheduleStatusText}>
            {schedule.isEnabled ? "On" : "Paused"}
          </Text>
        </View>
      </View>

      <View style={styles.scheduleDetails}>
        {schedule.nextVisitDueDate ? (
          <ScheduleDetail
            label="Next visit window"
            value={formatMonthYear(schedule.nextVisitDueDate)}
          />
        ) : null}
        <ScheduleDetail label="Appointment" value={appointmentStatus} />
        {schedule.nextAppointmentStatus === "not_scheduled" ? (
          <ScheduleDetail
            label={
              schedule.secondReminderLeadDays === null ||
              schedule.secondReminderLeadDays === undefined
                ? "Reminder"
                : "Reminders"
            }
            value={formatReminderSchedule(schedule)}
          />
        ) : null}
        <ScheduleDetail label="Schedule for" value={scheduleOwner} />
      </View>
    </View>
  );
}

function ScheduleDetail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.scheduleDetailRow}>
      <Text style={styles.scheduleDetailLabel}>{label}</Text>
      <Text style={styles.scheduleDetailValue}>{value}</Text>
    </View>
  );
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function formatMonthList(months: number[]): string {
  const names = months
    .map((month) => monthNames[month - 1])
    .filter((month): month is (typeof monthNames)[number] => Boolean(month));

  if (names.length <= 1) return names[0] ?? "your selected months";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;

  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}

function formatMonthYear(date: string): string {
  const [year, month] = date.slice(0, 10).split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function getAppointmentStatusLabel(
  status: ProviderVisitSchedule["nextAppointmentStatus"],
): string {
  switch (status) {
    case "scheduled":
      return "Next visit is already booked";
    case "not_scheduled":
      return "Not booked yet";
    case "not_needed":
      return "No next appointment needed";
    default:
      return "Next visit is not confirmed";
  }
}

function formatReminderLead(days: number | null): string {
  if (days === 0) return "On the visit month";
  if (days === 7) return "1 week before";
  if (days === 14) return "2 weeks before";
  if (days === 30 || days === null) return "1 month before";

  return `${days} days before`;
}

function formatReminderSchedule(schedule: ProviderVisitSchedule): string {
  const leadTimes = [
    schedule.reminderLeadDays ?? 30,
    schedule.secondReminderLeadDays,
  ]
    .filter((days): days is number => typeof days === "number")
    .sort((left, right) => right - left);

  return leadTimes.map(formatReminderLead).join(", ");
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
  avatar: {
    borderRadius: 8,
    height: 92,
    width: 92,
  },
  avatarFallback: {
    alignItems: "center",
    backgroundColor: "rgba(31, 53, 87, 0.14)",
    borderRadius: 8,
    height: 92,
    justifyContent: "center",
    width: 92,
  },
  avatarText: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 28,
    fontWeight: fontWeights.semibold,
  },
  providerType: {
    color: colors.secondary,
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: fontWeights.bold,
    marginTop: 14,
    textTransform: "uppercase",
  },
  providerName: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 26,
    fontWeight: fontWeights.bold,
    marginTop: 4,
    textAlign: "center",
  },
  specialty: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 15,
    marginTop: 4,
    textAlign: "center",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 24,
    paddingTop: 22,
  },
  editButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  editButtonText: {
    color: "#ffffff",
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: fontWeights.semibold,
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
  scheduleSummary: {
    backgroundColor: "#edf9f8",
    borderColor: "rgba(28, 184, 178, 0.28)",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
    padding: 14,
  },
  scheduleHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  scheduleIconFrame: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  scheduleIcon: {
    height: 18,
    tintColor: colors.secondary,
    width: 18,
  },
  scheduleHeadingGroup: {
    flex: 1,
    minWidth: 0,
  },
  scheduleEyebrow: {
    color: "#39716f",
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: fontWeights.bold,
    textTransform: "uppercase",
  },
  scheduleHeadline: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 15,
    fontWeight: fontWeights.semibold,
    lineHeight: 20,
    marginTop: 2,
  },
  scheduleStatus: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  scheduleStatusDot: {
    backgroundColor: colors.secondary,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  scheduleStatusDotPaused: {
    backgroundColor: "#8a96a8",
  },
  scheduleStatusText: {
    color: "#39716f",
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: fontWeights.bold,
  },
  scheduleDetails: {
    borderTopColor: "rgba(31, 53, 87, 0.1)",
    borderTopWidth: 1,
    gap: 10,
    marginTop: 13,
    paddingTop: 13,
  },
  scheduleDetailRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  scheduleDetailLabel: {
    color: "#657487",
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: fontWeights.semibold,
    lineHeight: 17,
    width: 104,
  },
  scheduleDetailValue: {
    color: colors.primary,
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: fontWeights.semibold,
    lineHeight: 17,
    textAlign: "right",
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
  phoneRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  callLink: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    minHeight: 28,
  },
  callIcon: {
    height: 12,
    tintColor: colors.secondary,
    width: 12,
  },
  callLinkText: {
    color: colors.secondary,
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: fontWeights.semibold,
  },
  appointmentHeader: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  appointmentSummary: {
    color: "#7b8798",
    flexShrink: 0,
    fontFamily: fonts.body,
    fontSize: 11,
    marginBottom: 2,
  },
  appointmentFilterRow: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(31, 53, 87, 0.08)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    padding: 6,
  },
  appointmentFilterButton: {
    alignItems: "center",
    borderRadius: 6,
    flex: 1,
    justifyContent: "center",
    minHeight: 42,
  },
  appointmentFilterButtonActive: {
    backgroundColor: colors.secondary,
  },
  appointmentFilterText: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: fontWeights.semibold,
  },
  appointmentFilterTextActive: {
    color: "#ffffff",
  },
  yearFilterRow: {
    gap: 8,
    paddingRight: 8,
    paddingTop: 12,
  },
  yearButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "rgba(31, 53, 87, 0.16)",
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 14,
  },
  yearButtonActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  yearButtonText: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: fontWeights.semibold,
  },
  yearButtonTextActive: {
    color: "#ffffff",
  },
  appointmentList: {
    gap: 10,
    marginTop: 14,
  },
  viewAllButton: {
    alignItems: "center",
    borderTopColor: "rgba(31, 53, 87, 0.12)",
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 16,
  },
  viewAllButtonText: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: fontWeights.semibold,
  },
  appointmentHelper: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14,
  },
  appointmentError: {
    color: "#d24747",
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: 14,
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
    marginTop: 20,
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  returnButtonText: {
    color: "#ffffff",
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: fontWeights.semibold,
  },
});
