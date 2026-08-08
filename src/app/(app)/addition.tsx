import { HapticButton } from "@/components/common/HapticButton";
import AddAppointmentForm from "@/components/appointments/add-appointment-form";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import AddProviderForm from "../../components/providers/add-provider-form";

const providerFilters: {
  label: string;
  value: string;
}[] = [
  { label: "Provider", value: "provider" },
  { label: "Appointment", value: "appointment" },
];

export default function AddScreen() {
  const [activeFilter, setActiveFilter] = useState<string>("provider");

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
        {activeFilter === "provider" ? (
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Care Team</Text>
            <Text style={styles.title}>Add a New Provider</Text>
          </View>
        ) : (
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Appointments</Text>
            <Text style={styles.title}>Add a New Appointment</Text>
          </View>
        )}

        <View style={styles.filterRow}>
          {providerFilters.map((filter) => {
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
            <AddProviderForm />
          ) : (
            <AddAppointmentForm />
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
