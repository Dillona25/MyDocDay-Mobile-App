import AddAppointmentForm from "@/components/appointments/add-appointment-form";
import { HapticButton } from "@/components/common/HapticButton";
import AddCareTaskForm from "@/components/reminders/add-care-task-form";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import AddProviderForm from "../../components/providers/add-provider-form";

type AdditionType = "provider" | "appointment" | "reminder";

const additionOptions: {
  eyebrow: string;
  label: string;
  title: string;
  value: AdditionType;
}[] = [
  {
    eyebrow: "Care Team",
    label: "Provider",
    title: "Add a New Provider",
    value: "provider",
  },
  {
    eyebrow: "Appointments",
    label: "Appointment",
    title: "Add a New Appointment",
    value: "appointment",
  },
  {
    eyebrow: "Health Reminders",
    label: "Reminder",
    title: "Add a Health Reminder",
    value: "reminder",
  },
];

export default function AddScreen() {
  const [activeFilter, setActiveFilter] =
    useState<AdditionType>("provider");
  const activeOption = additionOptions.find(
    (option) => option.value === activeFilter,
  )!;

  useFocusEffect(
    useCallback(() => {
      return () => {
        setActiveFilter("provider");
      };
    }, []),
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{activeOption.eyebrow}</Text>
          <Text style={styles.title}>{activeOption.title}</Text>
        </View>

        <View style={styles.filterRow}>
          {additionOptions.map((filter) => {
            const isActive = filter.value === activeFilter;

            return (
              <HapticButton
                key={filter.value}
                onPress={() => setActiveFilter(filter.value)}
                style={[
                  styles.filterButton,
                  isActive && styles.filterButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    isActive && styles.filterButtonTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </HapticButton>
            );
          })}
        </View>

        <View style={styles.formContainer}>
          {activeFilter === "provider" ? (
            <AddProviderForm
              onCreateSuccess={() => router.navigate("/providers")}
            />
          ) : activeFilter === "appointment" ? (
            <AddAppointmentForm
              onCreateSuccess={() => router.navigate("/appointments")}
            />
          ) : (
            <AddCareTaskForm
              onCreateSuccess={() => router.navigate("/reminders")}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f4f7fa",
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
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
    marginTop: 20,
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

  formContainer: {
    flex: 1,
    paddingTop: 24,
  },
});
