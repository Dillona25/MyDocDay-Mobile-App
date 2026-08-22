import { AppointmentCard } from "@/components/appointments/appointment-card";
import { HapticButton } from "@/components/common/HapticButton";
import { PickerModal } from "@/components/common/PickerModal";
import { CareScopeSelector } from "@/components/family/care-scope-selector";
import { useAppointments } from "@/hooks/useAppointments";
import { useCareScope } from "@/store/care-scope/CareScopeContext";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import type { Appointment } from "@/types/appointment";
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type AppointmentFilter = "upcoming" | "past";

type TimelineGroup = {
  dateKey: string;
  appointments: Appointment[];
  date: Date;
};

type TimelineMonth = {
  monthKey: string;
  label: string;
  groups: TimelineGroup[];
};

const appointmentFilters: {
  label: string;
  value: AppointmentFilter;
}[] = [
  { label: "Upcoming", value: "upcoming" },
  { label: "Past", value: "past" },
];

function getAppointmentDateTime(appointment: Appointment) {
  const [year, month, day] = appointment.date
    .slice(0, 10)
    .split("-")
    .map(Number);
  const [hours = 0, minutes = 0] = appointment.startTime.split(":").map(Number);

  return new Date(year, month - 1, day, hours, minutes);
}

function getDateKey(date: Date) {
  return [
    date.getFullYear(),
    (date.getMonth() + 1).toString().padStart(2, "0"),
    date.getDate().toString().padStart(2, "0"),
  ].join("-");
}

function groupAppointments(appointments: Appointment[]): TimelineGroup[] {
  const groups = new Map<string, Appointment[]>();

  appointments.forEach((appointment) => {
    const dateKey = appointment.date.slice(0, 10);
    const currentGroup = groups.get(dateKey) ?? [];

    currentGroup.push(appointment);
    groups.set(dateKey, currentGroup);
  });

  return Array.from(groups.entries()).map(([dateKey, groupedAppointments]) => ({
    dateKey,
    appointments: groupedAppointments,
    date: getAppointmentDateTime(groupedAppointments[0]),
  }));
}

function groupTimelineMonths(groups: TimelineGroup[]): TimelineMonth[] {
  const months = new Map<string, TimelineGroup[]>();

  groups.forEach((group) => {
    const monthKey = `${group.date.getFullYear()}-${group.date.getMonth()}`;
    const currentMonth = months.get(monthKey) ?? [];

    currentMonth.push(group);
    months.set(monthKey, currentMonth);
  });

  return Array.from(months.entries()).map(([monthKey, monthGroups]) => ({
    monthKey,
    groups: monthGroups,
    label: monthGroups[0].date.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    }),
  }));
}

function getDayLabel(date: Date) {
  const today = new Date();
  const tomorrow = new Date(today);

  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const comparisonDate = new Date(date);
  comparisonDate.setHours(0, 0, 0, 0);

  if (comparisonDate.getTime() === today.getTime()) {
    return "Today";
  }

  if (comparisonDate.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  }

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function AppointmentsScreen() {
  const { appointments: allAppointments, aptError, isLoadingApt } =
    useAppointments();
  const { matchesCareMember } = useCareScope();
  const appointments = useMemo(
    () =>
      allAppointments.filter((appointment) =>
        matchesCareMember(appointment.careMemberId),
      ),
    [allAppointments, matchesCareMember],
  );
  const [activeFilter, setActiveFilter] =
    useState<AppointmentFilter>("upcoming");
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [selectedPastYear, setSelectedPastYear] = useState<number | null>(null);
  const [selectedPastDate, setSelectedPastDate] = useState<Date | null>(null);
  const [draftPastDate, setDraftPastDate] = useState(() => new Date());
  const [selectedPastProvider, setSelectedPastProvider] = useState<
    string | null
  >(null);
  const [draftPastProvider, setDraftPastProvider] = useState<string | null>(
    null,
  );
  const [showIOSDatePicker, setShowIOSDatePicker] = useState(false);
  const [showProviderPicker, setShowProviderPicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setCurrentTime(new Date());

      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 60000);

      return () => {
        clearInterval(interval);
        setActiveFilter("upcoming");
        setSelectedPastYear(null);
        setSelectedPastDate(null);
        setDraftPastDate(new Date());
        setSelectedPastProvider(null);
        setDraftPastProvider(null);
        setShowIOSDatePicker(false);
        setShowProviderPicker(false);
      };
    }, []),
  );

  const { pastAppointments, upcomingAppointments } = useMemo(() => {
    const upcomingAppointments = appointments
      .filter(
        (appointment) => getAppointmentDateTime(appointment) >= currentTime,
      )
      .sort(
        (first, second) =>
          getAppointmentDateTime(first).getTime() -
          getAppointmentDateTime(second).getTime(),
      );
    const pastAppointments = appointments
      .filter(
        (appointment) => getAppointmentDateTime(appointment) < currentTime,
      )
      .sort(
        (first, second) =>
          getAppointmentDateTime(second).getTime() -
          getAppointmentDateTime(first).getTime(),
      );

    return { pastAppointments, upcomingAppointments };
  }, [appointments, currentTime]);

  const timelineGroups = useMemo(
    () => groupAppointments(upcomingAppointments),
    [upcomingAppointments],
  );
  const timelineMonths = useMemo(
    () => groupTimelineMonths(timelineGroups),
    [timelineGroups],
  );

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

  const pastProviderOptions = useMemo(() => {
    const options = new Map<string, string>();

    pastAppointments.forEach((appointment) => {
      if (!appointment.doctorName) {
        return;
      }

      const value = appointment.providerId
        ? `provider:${appointment.providerId}`
        : `name:${appointment.doctorName.toLowerCase()}`;

      options.set(value, appointment.doctorName);
    });

    return Array.from(options, ([value, label]) => ({ value, label })).sort(
      (first, second) => first.label.localeCompare(second.label),
    );
  }, [pastAppointments]);

  const filteredPastAppointments = useMemo(() => {
    const selectedDateKey = selectedPastDate
      ? getDateKey(selectedPastDate)
      : null;

    return pastAppointments.filter((appointment) => {
      const matchesDate = selectedDateKey
        ? appointment.date.slice(0, 10) === selectedDateKey
        : true;
      const matchesYear =
        !selectedPastYear || selectedDateKey
          ? true
          : getAppointmentDateTime(appointment).getFullYear() ===
            selectedPastYear;
      const providerFilterValue = appointment.providerId
        ? `provider:${appointment.providerId}`
        : appointment.doctorName
          ? `name:${appointment.doctorName.toLowerCase()}`
          : null;
      const matchesProvider = selectedPastProvider
        ? providerFilterValue === selectedPastProvider
        : true;

      return matchesDate && matchesYear && matchesProvider;
    });
  }, [
    pastAppointments,
    selectedPastDate,
    selectedPastProvider,
    selectedPastYear,
  ]);

  const visibleAppointmentCount =
    activeFilter === "upcoming"
      ? upcomingAppointments.length
      : filteredPastAppointments.length;
  const selectedProviderLabel = selectedPastProvider
    ? pastProviderOptions.find(
        (providerOption) => providerOption.value === selectedPastProvider,
      )?.label
    : null;

  function selectPastYear(year: number | null) {
    setSelectedPastYear(year);
    setSelectedPastDate(null);
    setShowIOSDatePicker(false);
  }

  function selectPastDate(date: Date) {
    setSelectedPastDate(date);
    setSelectedPastYear(date.getFullYear());
  }

  function handlePastDateChange(event: DateTimePickerEvent, date?: Date) {
    if (event.type !== "set" || !date) {
      return;
    }

    selectPastDate(date);
  }

  function handleDraftPastDateChange(
    event: DateTimePickerEvent,
    date?: Date,
  ) {
    if (event.type === "set" && date) {
      setDraftPastDate(date);
    }
  }

  function openPastDatePicker() {
    setShowProviderPicker(false);

    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: selectedPastDate ?? currentTime,
        mode: "date",
        maximumDate: currentTime,
        onChange: handlePastDateChange,
      });
      return;
    }

    setDraftPastDate(selectedPastDate ?? currentTime);
    setShowIOSDatePicker((isVisible) => !isVisible);
  }

  const hasActiveHistoryFilter =
    selectedPastYear !== null ||
    selectedPastDate !== null ||
    selectedPastProvider !== null;
  const emptyTitle =
    activeFilter === "past" &&
    pastAppointments.length > 0 &&
    hasActiveHistoryFilter
      ? "No matching appointments"
      : "No appointments here yet";
  const emptyCopy =
    activeFilter === "upcoming"
      ? "Use the + button to add an appointment. It will appear here as your care schedule grows."
      : hasActiveHistoryFilter
        ? "Try adjusting the year, date, or provider to see more history."
        : "Completed appointments will collect here over time.";

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Care Schedule</Text>
          <Text style={styles.title}>Your Appointments</Text>
          <Text style={styles.description}>
            Keep every visit organized in one clear timeline.
          </Text>
        </View>

        <CareScopeSelector />

        <View style={styles.filterRow}>
          {appointmentFilters.map((filter) => {
            const isActive = activeFilter === filter.value;

            return (
              <HapticButton
                key={filter.value}
                onPress={() => setActiveFilter(filter.value)}
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

        {activeFilter === "past" && pastAppointments.length > 0 ? (
          <View style={styles.historyFilters}>
            <Text style={styles.historyFilterLabel}>Filter history</Text>

            <ScrollView
              contentContainerStyle={styles.yearFilterRow}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <HapticButton
                onPress={() => selectPastYear(null)}
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
                    onPress={() => selectPastYear(year)}
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

            <View style={styles.dateFilterRow}>
              <HapticButton
                onPress={openPastDatePicker}
                style={styles.dateFilterButton}
              >
                <Text style={styles.dateFilterEyebrow}>Exact date</Text>
                <Text style={styles.dateFilterValue}>
                  {selectedPastDate
                    ? selectedPastDate.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Choose a date"}
                </Text>
              </HapticButton>

              {selectedPastDate ? (
                <HapticButton
                  onPress={() => {
                    setSelectedPastDate(null);
                    setShowIOSDatePicker(false);
                  }}
                  style={styles.clearDateButton}
                >
                  <Text style={styles.clearDateButtonText}>Clear</Text>
                </HapticButton>
              ) : null}
            </View>

            {Platform.OS === "ios" && showIOSDatePicker ? (
              <PickerModal
                onClose={() => setShowIOSDatePicker(false)}
                onDone={() => {
                  selectPastDate(draftPastDate);
                  setShowIOSDatePicker(false);
                }}
                title="Choose an exact date"
                visible
              >
                <DateTimePicker
                  display="spinner"
                  maximumDate={currentTime}
                  mode="date"
                  onChange={handleDraftPastDateChange}
                  style={styles.historyNativePicker}
                  textColor={colors.primary}
                  value={draftPastDate}
                />
              </PickerModal>
            ) : null}

            {pastProviderOptions.length > 0 ? (
              <>
                <HapticButton
                  onPress={() => {
                    setShowIOSDatePicker(false);
                    if (showProviderPicker) {
                      setShowProviderPicker(false);
                    } else {
                      setDraftPastProvider(selectedPastProvider);
                      setShowProviderPicker(true);
                    }
                  }}
                  style={[
                    styles.providerFilterButton,
                    showProviderPicker
                      ? styles.providerFilterButtonActive
                      : null,
                  ]}
                >
                  <Text style={styles.providerFilterLabel}>Provider</Text>
                  <Text style={styles.providerFilterValue}>
                    {selectedProviderLabel ?? "Any provider"}
                  </Text>
                </HapticButton>

                {showProviderPicker ? (
                  <PickerModal
                    onClose={() => setShowProviderPicker(false)}
                    onDone={() => {
                      setSelectedPastProvider(draftPastProvider);
                      setShowProviderPicker(false);
                    }}
                    title="Choose a provider"
                    visible
                  >
                    <Picker
                      dropdownIconColor={colors.primary}
                      mode="dropdown"
                      onValueChange={(value) =>
                        setDraftPastProvider(value || null)
                      }
                      selectedValue={draftPastProvider ?? ""}
                      style={styles.providerPicker}
                    >
                      <Picker.Item label="Any provider" value="" />
                      {pastProviderOptions.map((providerOption) => (
                        <Picker.Item
                          key={providerOption.value}
                          label={providerOption.label}
                          value={providerOption.value}
                        />
                      ))}
                    </Picker>
                  </PickerModal>
                ) : null}
              </>
            ) : null}
          </View>
        ) : null}

        {isLoadingApt ? (
          <View style={styles.statusContainer}>
            <ActivityIndicator color={colors.secondary} />
            <Text style={styles.statusText}>Loading appointments...</Text>
          </View>
        ) : null}

        {aptError ? <Text style={styles.errorText}>{aptError}</Text> : null}

        {!isLoadingApt && !aptError && visibleAppointmentCount === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptyText}>{emptyCopy}</Text>
          </View>
        ) : null}

        {!isLoadingApt &&
        !aptError &&
        activeFilter === "upcoming" &&
        timelineGroups.length > 0 ? (
          <View style={styles.timeline}>
            {timelineMonths.map((month) => (
              <View key={month.monthKey} style={styles.timelineMonth}>
                <View style={styles.monthHeader}>
                  <Text style={styles.monthTitle}>{month.label}</Text>
                  <View style={styles.monthRule} />
                </View>

                {month.groups.map((group, groupIndex) => (
                  <View key={group.dateKey} style={styles.timelineGroup}>
                    <View style={styles.timelineRail}>
                      <View style={styles.dateBadge}>
                        <Text style={styles.dateMonth}>
                          {group.date.toLocaleDateString(undefined, {
                            month: "short",
                          })}
                        </Text>
                        <Text style={styles.dateDay}>
                          {group.date.getDate()}
                        </Text>
                      </View>
                      {groupIndex < month.groups.length - 1 ? (
                        <View style={styles.timelineLine} />
                      ) : null}
                    </View>

                    <View style={styles.timelineContent}>
                      <View style={styles.groupHeader}>
                        <Text style={styles.groupTitle}>
                          {getDayLabel(group.date)}
                        </Text>
                        <Text style={styles.groupCount}>
                          {group.appointments.length}{" "}
                          {group.appointments.length === 1
                            ? "appointment"
                            : "appointments"}
                        </Text>
                      </View>

                      <View style={styles.appointmentList}>
                        {group.appointments.map((appointment) => (
                          <AppointmentCard
                            appointment={appointment}
                            key={appointment.id}
                            variant="full"
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {!isLoadingApt &&
        !aptError &&
        activeFilter === "past" &&
        filteredPastAppointments.length > 0 ? (
          <View style={styles.historyList}>
            {filteredPastAppointments.map((appointment) => {
              const appointmentDate = getAppointmentDateTime(appointment);

              return (
                <View key={appointment.id} style={styles.historyEntry}>
                  <Text style={styles.heldDate}>
                    Held on{" "}
                    {appointmentDate.toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                  <AppointmentCard appointment={appointment} variant="full" />
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f4f7fa",
    flex: 1,
  },
  content: {
    gap: 18,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    gap: 8,
  },
  eyebrow: {
    color: colors.secondary,
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: fontWeights.bold,
    textTransform: "uppercase",
  },
  title: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 30,
    fontWeight: fontWeights.bold,
    lineHeight: 36,
  },
  description: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
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
    minHeight: 46,
    paddingVertical: 10,
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
  historyFilters: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(31, 53, 87, 0.08)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  historyFilterLabel: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 15,
    fontWeight: fontWeights.semibold,
  },
  yearFilterRow: {
    gap: 8,
    paddingRight: 8,
  },
  yearButton: {
    alignItems: "center",
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
  dateFilterRow: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: 8,
  },
  dateFilterButton: {
    backgroundColor: "#f8fafc",
    borderColor: "rgba(31, 53, 87, 0.14)",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: 14,
  },
  dateFilterEyebrow: {
    color: "#7b8798",
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: fontWeights.semibold,
    textTransform: "uppercase",
  },
  dateFilterValue: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: fontWeights.semibold,
    marginTop: 2,
  },
  clearDateButton: {
    alignItems: "center",
    borderColor: "rgba(31, 53, 87, 0.14)",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: 14,
  },
  clearDateButtonText: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: fontWeights.semibold,
  },
  historyNativePicker: {
    height: 216,
    width: "100%",
  },
  providerFilterButton: {
    backgroundColor: "#f8fafc",
    borderColor: "rgba(31, 53, 87, 0.14)",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: 14,
  },
  providerFilterButtonActive: {
    borderColor: colors.secondary,
    borderWidth: 2,
  },
  providerFilterLabel: {
    color: "#7b8798",
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: fontWeights.semibold,
    textTransform: "uppercase",
  },
  providerFilterValue: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: fontWeights.semibold,
    marginTop: 2,
  },
  providerPicker: {
    color: colors.primary,
    fontFamily: fonts.body,
    height: Platform.select({ ios: 216, default: 56 }),
    width: "100%",
  },
  statusContainer: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 48,
  },
  statusText: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 14,
  },
  errorText: {
    color: "#d24747",
    fontFamily: fonts.body,
    fontSize: 14,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  emptyDate: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "rgba(31, 53, 87, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    height: 78,
    justifyContent: "center",
    width: 78,
  },
  emptyDateMonth: {
    color: colors.secondary,
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: fontWeights.bold,
    textTransform: "uppercase",
  },
  emptyDateMark: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 30,
    fontWeight: fontWeights.semibold,
    lineHeight: 34,
  },
  emptyTitle: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 19,
    fontWeight: fontWeights.semibold,
    marginTop: 18,
  },
  emptyText: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    maxWidth: 280,
    textAlign: "center",
  },
  timeline: {
    gap: 18,
  },
  timelineMonth: {
    gap: 0,
  },
  monthHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  monthTitle: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 20,
    fontWeight: fontWeights.bold,
  },
  monthRule: {
    backgroundColor: "rgba(31, 53, 87, 0.14)",
    flex: 1,
    height: 1,
  },
  timelineGroup: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: 14,
  },
  timelineRail: {
    alignItems: "center",
    width: 48,
  },
  dateBadge: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: colors.secondary,
    borderRadius: 8,
    borderWidth: 2,
    height: 52,
    justifyContent: "center",
    width: 48,
  },
  dateMonth: {
    color: colors.secondary,
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: fontWeights.bold,
    textTransform: "uppercase",
  },
  dateDay: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 20,
    fontWeight: fontWeights.bold,
    lineHeight: 23,
  },
  timelineLine: {
    backgroundColor: "rgba(28, 184, 178, 0.3)",
    flex: 1,
    minHeight: 28,
    width: 2,
  },
  timelineContent: {
    flex: 1,
    minWidth: 0,
    paddingBottom: 24,
  },
  groupHeader: {
    marginBottom: 10,
  },
  groupTitle: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 17,
    fontWeight: fontWeights.semibold,
  },
  groupCount: {
    color: "#7b8798",
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  appointmentList: {
    gap: 12,
  },
  historyList: {
    gap: 22,
  },
  historyEntry: {
    gap: 8,
  },
  heldDate: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: fontWeights.semibold,
  },
});
