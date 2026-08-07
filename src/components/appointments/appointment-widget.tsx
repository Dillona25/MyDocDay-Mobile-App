import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const DAYS_TO_SHOW = 6;

function getDateKey(date: Date) {
  return [
    date.getFullYear(),
    (date.getMonth() + 1).toString().padStart(2, "0"),
    date.getDate().toString().padStart(2, "0"),
  ].join("-");
}

function getAppointmentDays(currentDate: Date) {
  const today = new Date(currentDate);

  return Array.from({ length: DAYS_TO_SHOW }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);

    return {
      day: date.getDate().toString(),
      id: getDateKey(date),
      isToday: index === 0,
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
    };
  });
}

export function AppointmentWidget() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const appointmentDays = useMemo(
    () => getAppointmentDays(currentDate),
    [currentDate],
  );
  const monthYearLabel = currentDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const [selectedDayId, setSelectedDayId] = useState(appointmentDays[0]?.id);
  const selectedDay = appointmentDays.find((day) => day.id === selectedDayId);
  const appointmentTitle = selectedDay?.isToday
    ? "No appointments today"
    : "No appointments scheduled";

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate((previousDate) => {
        const nextDate = new Date();

        return getDateKey(previousDate) === getDateKey(nextDate)
          ? previousDate
          : nextDate;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!appointmentDays.some((day) => day.id === selectedDayId)) {
      setSelectedDayId(appointmentDays[0]?.id);
    }
  }, [appointmentDays, selectedDayId]);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Appointments</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/add-appointment")}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      <Text style={styles.monthYearLabel}>{monthYearLabel}</Text>

      <View style={styles.dayRow}>
        {appointmentDays.map((day) => {
          const isSelected = day.id === selectedDayId;

          return (
            <Pressable
              key={day.id}
              accessibilityRole="button"
              onPress={() => setSelectedDayId(day.id)}
              style={[
                styles.dayButton,
                isSelected ? styles.dayButtonSelected : null,
              ]}
            >
              <Text
                style={[
                  styles.dayNumber,
                  isSelected ? styles.dayTextSelected : null,
                ]}
              >
                {day.day}
              </Text>
              <Text
                style={[
                  styles.dayLabel,
                  isSelected ? styles.dayTextSelected : null,
                ]}
              >
                {day.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.emptyCard}>
        <Image
          accessibilityLabel="Relaxing with no appointments"
          contentFit="contain"
          source={require("../../assets/relax.svg")}
          style={styles.emptyImage}
        />
        <Text style={styles.emptyTitle}>{appointmentTitle}</Text>
        <Text style={styles.emptyText}>
          When appointments are added, they will show here for the selected day.
        </Text>
      </View>

      <Pressable
        onPress={() => router.push("/appointments")}
        style={styles.footerButton}
      >
        <Text style={styles.footerButtonText}>View all appointments</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(31, 53, 87, 0.08)",
    borderRadius: 8,
    borderWidth: 1,
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
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  cardTitle: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 20,
    fontWeight: fontWeights.semibold,
  },
  addButton: {
    alignItems: "center",
    backgroundColor: "rgba(28, 184, 178, 0.14)",
    borderRadius: 8,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  addButtonText: {
    color: colors.secondary,
    fontFamily: fonts.body,
    fontSize: 22,
    fontWeight: fontWeights.bold,
    lineHeight: 24,
  },
  monthYearLabel: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: fontWeights.regular,
    marginBottom: 14,
  },
  dayRow: {
    flexDirection: "row",
    gap: 10,
  },
  dayButton: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: "rgba(31, 53, 87, 0.08)",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 72,
  },
  dayButtonSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  dayNumber: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 22,
    fontWeight: fontWeights.bold,
  },
  dayLabel: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: fontWeights.semibold,
    marginTop: 2,
    textTransform: "uppercase",
  },
  dayTextSelected: {
    color: "#ffffff",
  },
  emptyCard: {
    alignItems: "center",
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  emptyImage: {
    height: 118,
    width: 158,
  },
  emptyTitle: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 18,
    fontWeight: fontWeights.semibold,
    marginTop: 10,
    textAlign: "center",
  },
  emptyText: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    maxWidth: 260,
    textAlign: "center",
  },
  footerButton: {
    alignItems: "center",
    borderColor: "rgba(31, 53, 87, 0.12)",
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 16,
  },
  footerButtonText: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: fontWeights.semibold,
  },
});
