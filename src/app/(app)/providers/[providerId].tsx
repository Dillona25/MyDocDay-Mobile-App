import { AppointmentCard } from "@/components/appointments/appointment-card";
import { BackButton } from "@/components/common/BackButton";
import { HapticButton } from "@/components/common/HapticButton";
import { useAppointments } from "@/hooks/useAppointments";
import { useProviders } from "@/hooks/useProviders";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import type { Appointment } from "@/types/appointment";
import { Image } from "expo-image";
import { router, type Href, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
  const { providerId, returnTo } = useLocalSearchParams<{
    providerId: string;
    returnTo?: string;
  }>();
  const numericProviderId = Number(providerId);
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

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.backNavigation}>
          <BackButton
            href={returnTo === "/dashboard" ? "/dashboard" : "/providers"}
            navigationMode={returnTo === "/dashboard" ? "navigate" : "dismiss"}
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
          <Text style={styles.sectionEyebrow}>Contact and location</Text>
          <Text style={styles.sectionTitle}>Provider information</Text>

          <View style={styles.detailList}>
            <DetailRow label="Specialty" value={provider.specialty} />
            <DetailRow label="Phone" value={provider.phoneNumber} />
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
    backgroundColor: colors.secondary,
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
