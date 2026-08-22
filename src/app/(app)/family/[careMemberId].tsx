import { getCareMemberImageSource } from "@/api/care-members/care-members";
import { BackButton } from "@/components/common/BackButton";
import { HapticButton } from "@/components/common/HapticButton";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import { ProviderWidget } from "@/components/providers/provider-widget";
import { useAppointments } from "@/hooks/useAppointments";
import { useCareMembers } from "@/hooks/useCareMembers";
import { useProviders } from "@/hooks/useProviders";
import { useAuth } from "@/store/auth/AuthContext";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import type { ProviderType } from "@/types/provider";
import { Image } from "expo-image";
import { router, type Href, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type AppointmentFilter = "upcoming" | "past";

const MAX_VISIBLE_PROVIDERS = 4;
const MAX_VISIBLE_APPOINTMENTS = 4;

function getAppointmentDateTime(date: string, startTime: string) {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);
  const [hours = 0, minutes = 0] = startTime.split(":").map(Number);

  return new Date(year, month - 1, day, hours, minutes);
}

export default function FamilyMemberDetailsScreen() {
  const { careMemberId, returnTo } = useLocalSearchParams<{
    careMemberId: string;
    returnTo?: string;
  }>();
  const { token } = useAuth();
  const { careMembers, error, isLoading } = useCareMembers();
  const {
    appointments,
    aptError,
    isLoadingApt,
  } = useAppointments();
  const {
    error: providersError,
    isLoading: providersLoading,
    providers,
  } = useProviders();
  const [appointmentFilter, setAppointmentFilter] =
    useState<AppointmentFilter>("upcoming");
  const [providerFilter, setProviderFilter] =
    useState<ProviderType>("provider");
  const numericCareMemberId = Number(careMemberId);
  const careMember = careMembers.find(
    (member) => member.id === numericCareMemberId,
  );
  const memberProviders = providers.filter((provider) =>
    provider.careMembers.some((member) => member.id === numericCareMemberId),
  );
  const memberClinics = memberProviders.filter(
    (provider) => provider.type === "clinic",
  );
  const memberIndividualProviders = memberProviders.filter(
    (provider) => provider.type === "provider",
  );
  const visibleProviders = memberProviders.filter(
    (provider) => provider.type === providerFilter,
  );
  const memberAppointments = appointments.filter(
    (appointment) => appointment.careMemberId === numericCareMemberId,
  );
  const currentTime = new Date();
  const upcomingAppointments = memberAppointments
    .filter(
      (appointment) =>
        getAppointmentDateTime(appointment.date, appointment.startTime) >=
        currentTime,
    )
    .sort(
      (left, right) =>
        getAppointmentDateTime(left.date, left.startTime).getTime() -
        getAppointmentDateTime(right.date, right.startTime).getTime(),
    );
  const pastAppointments = memberAppointments
    .filter(
      (appointment) =>
        getAppointmentDateTime(appointment.date, appointment.startTime) <
        currentTime,
    )
    .sort(
      (left, right) =>
        getAppointmentDateTime(right.date, right.startTime).getTime() -
        getAppointmentDateTime(left.date, left.startTime).getTime(),
    );
  const visibleAppointments =
    appointmentFilter === "upcoming"
      ? upcomingAppointments
      : pastAppointments;

  useEffect(() => {
    if (
      !providersLoading &&
      memberIndividualProviders.length === 0 &&
      memberClinics.length > 0
    ) {
      setProviderFilter("clinic");
    }
  }, [
    memberClinics.length,
    memberIndividualProviders.length,
    providersLoading,
  ]);

  useEffect(() => {
    if (
      !isLoadingApt &&
      upcomingAppointments.length === 0 &&
      pastAppointments.length > 0
    ) {
      setAppointmentFilter("past");
    }
  }, [
    isLoadingApt,
    pastAppointments.length,
    upcomingAppointments.length,
  ]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centeredState}>
          <ActivityIndicator color={colors.secondary} />
          <Text style={styles.stateText}>Loading family member...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !careMember) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centeredState}>
          <Text style={styles.stateTitle}>Family member not available</Text>
          <Text style={styles.stateText}>
            {error || "This person could not be found in your family list."}
          </Text>
          <HapticButton
            onPress={() => router.replace("/family" as Href)}
            style={styles.returnButton}
          >
            <Text style={styles.returnButtonText}>Return to family</Text>
          </HapticButton>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = [careMember.firstName, careMember.lastName]
    .filter(Boolean)
    .join(" ");
  const possessiveFirstName = careMember.firstName.endsWith("s")
    ? `${careMember.firstName}'`
    : `${careMember.firstName}'s`;
  const initials = `${careMember.firstName.charAt(0)}${careMember.lastName?.charAt(0) ?? ""}`.toUpperCase();
  const imageSource = getCareMemberImageSource(
    careMember.profileImageUrl,
    token,
  );
  const memberReturnPath = `/family/${numericCareMemberId}`;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <BackButton
          href={
            (returnTo === "/dashboard" ? "/dashboard" : "/family") as Href
          }
          navigationMode={returnTo === "/dashboard" ? "navigate" : "dismiss"}
        />
        <View style={styles.identitySection}>
          {imageSource ? (
            <Image contentFit="cover" source={imageSource} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <Text style={styles.eyebrow}>Family member</Text>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.relationship}>{careMember.relationship}</Text>
        </View>

        <HapticButton
          onPress={() =>
            router.push(`/family/${numericCareMemberId}/edit` as Href)
          }
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>Edit {careMember.firstName}</Text>
        </HapticButton>

        <View style={styles.infoSection}>
          <Text style={styles.sectionEyebrow}>Care profile</Text>
          <Text style={styles.sectionTitle}>
            {possessiveFirstName} Information
          </Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name</Text>
            <Text style={styles.detailValue}>{displayName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Relationship</Text>
            <Text style={styles.detailValue}>{careMember.relationship}</Text>
          </View>
        </View>

        <View style={styles.careSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionEyebrow}>Care team</Text>
              <Text style={styles.sectionTitle}>
                {possessiveFirstName} Care Team
              </Text>
            </View>
            {!providersLoading && !providersError ? (
              <Text style={styles.sectionCount}>{memberProviders.length}</Text>
            ) : null}
          </View>

          {!providersLoading && !providersError && memberClinics.length > 0 ? (
            <View style={styles.filterRow}>
              {([
                { label: "Providers", value: "provider" },
                { label: "Clinics", value: "clinic" },
              ] as const).map((filter) => {
                const isActive = providerFilter === filter.value;

                return (
                  <HapticButton
                    key={filter.value}
                    onPress={() => setProviderFilter(filter.value)}
                    style={[
                      styles.filterButton,
                      isActive ? styles.filterButtonActive : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        isActive ? styles.filterButtonTextActive : null,
                      ]}
                    >
                      {filter.label}
                    </Text>
                  </HapticButton>
                );
              })}
            </View>
          ) : null}

          {providersLoading ? (
            <Text style={styles.helperText}>Loading providers...</Text>
          ) : null}
          {providersError ? (
            <Text style={styles.errorText}>{providersError}</Text>
          ) : null}
          {!providersLoading && !providersError && visibleProviders.length === 0 ? (
            <Text style={styles.helperText}>
              No {providerFilter === "clinic" ? "clinics" : "providers"} are
              assigned to {careMember.firstName} yet.
            </Text>
          ) : null}

          <View style={styles.cardList}>
            {visibleProviders
              .slice(0, MAX_VISIBLE_PROVIDERS)
              .map((provider) => (
                <ProviderWidget
                  key={provider.id}
                  provider={provider}
                  returnTo={memberReturnPath}
                />
              ))}
          </View>
          {visibleProviders.length > MAX_VISIBLE_PROVIDERS ? (
            <Text style={styles.moreText}>
              +{visibleProviders.length - MAX_VISIBLE_PROVIDERS} more {providerFilter === "clinic" ? "clinics" : "providers"}
            </Text>
          ) : null}
        </View>

        <View style={styles.careSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionEyebrow}>Appointments</Text>
              <Text style={styles.sectionTitle}>
                {possessiveFirstName} Appointment Schedule
              </Text>
            </View>
            {!isLoadingApt && !aptError ? (
              <Text style={styles.appointmentSummary}>
                {upcomingAppointments.length} upcoming | {pastAppointments.length} past
              </Text>
            ) : null}
          </View>

          {pastAppointments.length > 0 ? (
            <View style={styles.filterRow}>
              {(["upcoming", "past"] as const).map((filter) => {
                const isActive = appointmentFilter === filter;

                return (
                  <HapticButton
                    key={filter}
                    onPress={() => setAppointmentFilter(filter)}
                    style={[
                      styles.filterButton,
                      isActive ? styles.filterButtonActive : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        isActive ? styles.filterButtonTextActive : null,
                      ]}
                    >
                      {filter === "upcoming" ? "Upcoming" : "Past"}
                    </Text>
                  </HapticButton>
                );
              })}
            </View>
          ) : null}

          {isLoadingApt ? (
            <Text style={styles.helperText}>Loading appointments...</Text>
          ) : null}
          {aptError ? <Text style={styles.errorText}>{aptError}</Text> : null}
          {!isLoadingApt && !aptError && visibleAppointments.length === 0 ? (
            <Text style={styles.helperText}>
              {appointmentFilter === "upcoming"
                ? `No upcoming appointments for ${careMember.firstName}.`
                : `No past appointments for ${careMember.firstName}.`}
            </Text>
          ) : null}

          <View style={styles.cardList}>
            {visibleAppointments
              .slice(0, MAX_VISIBLE_APPOINTMENTS)
              .map((appointment) => (
                <AppointmentCard
                  appointment={appointment}
                  key={appointment.id}
                  returnTo={memberReturnPath}
                  variant="compact"
                />
              ))}
          </View>
          {visibleAppointments.length > MAX_VISIBLE_APPOINTMENTS ? (
            <Text style={styles.moreText}>
              +{visibleAppointments.length - MAX_VISIBLE_APPOINTMENTS} more {appointmentFilter}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#f4f7fa", flex: 1 },
  content: { gap: 22, padding: 24, paddingBottom: 120 },
  centeredState: {
    alignItems: "center",
    flex: 1,
    gap: 10,
    justifyContent: "center",
    padding: 28,
  },
  stateTitle: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 20,
    fontWeight: fontWeights.semibold,
  },
  stateText: { color: "#536173", fontFamily: fonts.body, fontSize: 14, textAlign: "center" },
  returnButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  returnButtonText: { color: "#ffffff", fontFamily: fonts.body, fontWeight: fontWeights.semibold },
  identitySection: { alignItems: "center", paddingVertical: 10 },
  avatar: { borderRadius: 8, height: 104, width: 104 },
  avatarFallback: {
    alignItems: "center",
    backgroundColor: "rgba(28, 184, 178, 0.18)",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 30,
    fontWeight: fontWeights.bold,
  },
  eyebrow: {
    color: colors.secondary,
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: fontWeights.semibold,
    marginTop: 16,
    textTransform: "uppercase",
  },
  name: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 28,
    fontWeight: fontWeights.bold,
    marginTop: 4,
    textAlign: "center",
  },
  relationship: { color: "#536173", fontFamily: fonts.body, fontSize: 15, marginTop: 5 },
  editButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 48,
  },
  editButtonText: { color: "#ffffff", fontFamily: fonts.body, fontSize: 15, fontWeight: fontWeights.semibold },
  infoSection: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(31, 53, 87, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    padding: 18,
  },
  sectionEyebrow: { color: colors.secondary, fontFamily: fonts.body, fontSize: 11, fontWeight: fontWeights.semibold, textTransform: "uppercase" },
  sectionTitle: { color: colors.primary, fontFamily: fonts.heading, fontSize: 20, fontWeight: fontWeights.semibold, marginTop: 4, marginBottom: 14 },
  detailRow: { borderTopColor: "#eef2f6", borderTopWidth: 1, paddingVertical: 12 },
  detailLabel: { color: "#8a96a8", fontFamily: fonts.body, fontSize: 11, fontWeight: fontWeights.semibold, textTransform: "uppercase" },
  detailValue: { color: colors.primary, fontFamily: fonts.body, fontSize: 15, marginTop: 4 },
  careSection: {
    borderTopColor: "rgba(31, 53, 87, 0.08)",
    borderTopWidth: 1,
    gap: 14,
    paddingTop: 22,
  },
  sectionHeader: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  sectionHeading: {
    flex: 1,
    minWidth: 0,
  },
  sectionCount: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: fontWeights.bold,
  },
  appointmentSummary: {
    color: "#7b8798",
    flexShrink: 0,
    fontFamily: fonts.body,
    fontSize: 11,
    marginBottom: 2,
  },
  cardList: {
    gap: 10,
  },
  helperText: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: "#d24747",
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  moreText: {
    color: "#7b8798",
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: fontWeights.semibold,
    textAlign: "center",
  },
  filterRow: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(31, 53, 87, 0.08)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 6,
  },
  filterButton: {
    alignItems: "center",
    borderRadius: 6,
    flex: 1,
    justifyContent: "center",
    minHeight: 42,
  },
  filterButtonActive: {
    backgroundColor: colors.secondary,
  },
  filterButtonText: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: fontWeights.semibold,
  },
  filterButtonTextActive: {
    color: "#ffffff",
  },
});
