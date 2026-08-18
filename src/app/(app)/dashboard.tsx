import { AppointmentWidget } from "@/components/appointments/appointment-widget";
import { HapticButton } from "@/components/common/HapticButton";
import { UserBar } from "@/components/dashboard/user-bar";
import { ProviderWidget } from "@/components/providers/provider-widget";
import { ReminderWidget } from "@/components/reminders/reminder-widget";
import { useProviders } from "@/hooks/useProviders";
import { useAuth } from "@/store/auth/AuthContext";
import { borderPrimary } from "@/theme/borders";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import type { ProviderType } from "@/types/provider";
import { router, type Href } from "expo-router";
import { useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

const MAX_VISIBLE_PROVIDERS = 4;

export default function DashboardScreen() {
  const { user } = useAuth();
  const { error, isLoading, providers } = useProviders();
  const [providerFilter, setProviderFilter] =
    useState<ProviderType>("provider");
  const filteredProviders = providers.filter(
    (provider) => provider.type === providerFilter,
  );
  const visibleProviders = filteredProviders.slice(0, MAX_VISIBLE_PROVIDERS);
  const hasMoreProviders = filteredProviders.length > MAX_VISIBLE_PROVIDERS;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <UserBar user={user} />

        <View style={styles.widgetContent}>
          <ReminderWidget />

          <AppointmentWidget />

          <View style={styles.dashboardCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Care Team</Text>
              <View style={styles.compactFilter}>
                <DashboardFilterButton
                  active={providerFilter === "provider"}
                  label="Providers"
                  onPress={() => setProviderFilter("provider")}
                />
                <DashboardFilterButton
                  active={providerFilter === "clinic"}
                  label="Clinics"
                  onPress={() => setProviderFilter("clinic")}
                />
              </View>
            </View>

            {isLoading ? (
              <Text style={styles.helperText}>Loading providers...</Text>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : filteredProviders.length > 0 ? (
              <View style={styles.providerList}>
                {visibleProviders.map((provider) => (
                  <View key={provider.id} style={styles.providerContainer}>
                    <ProviderWidget
                      provider={provider}
                      returnTo="/dashboard"
                    />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.providerListEmpty}>
                <Text style={styles.emptyTitle}>
                  No {providerFilter === "provider" ? "providers" : "clinics"} yet
                </Text>
                <Text style={styles.emptyText}>
                  Use the + button to add your first {providerFilter}. It will
                  appear here.
                </Text>
              </View>
            )}

            {!isLoading && !error && hasMoreProviders ? (
              <HapticButton
                onPress={() =>
                  router.push(
                    `/providers?filter=${providerFilter}` as Href,
                  )
                }
                style={styles.footerButton}
              >
                <Text style={styles.footerButtonText}>
                  View all{" "}
                  {providerFilter === "provider" ? "providers" : "clinics"}
                </Text>
              </HapticButton>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DashboardFilterButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <HapticButton
      onPress={onPress}
      style={[
        styles.compactFilterButton,
        active ? styles.compactFilterButtonActive : null,
      ]}
    >
      <Text
        style={[
          styles.compactFilterText,
          active ? styles.compactFilterTextActive : null,
        ]}
      >
        {label}
      </Text>
    </HapticButton>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f4f7fa",
  },
  content: {
    paddingTop: 0,
    paddingBottom: 32,
  },
  widgetContent: {
    gap: 18,
    marginTop: 18,
    paddingHorizontal: 24,
  },
  helperText: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 14,
    paddingVertical: 8,
  },
  errorText: {
    color: "#d24747",
    fontFamily: fonts.body,
    fontSize: 14,
    paddingVertical: 8,
  },
  dashboardCard: {
    ...borderPrimary,
    backgroundColor: "#ffffff",
    borderRadius: 8,
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
    marginBottom: 14,
    borderColor: "rgba(31, 53, 87, 0.12)",
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  cardTitle: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 20,
    fontWeight: fontWeights.semibold,
  },
  compactFilter: {
    backgroundColor: "#f4f7fa",
    borderColor: "rgba(31, 53, 87, 0.1)",
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: "row",
    padding: 3,
  },
  compactFilterButton: {
    alignItems: "center",
    borderRadius: 4,
    justifyContent: "center",
    minHeight: 30,
    paddingHorizontal: 9,
  },
  compactFilterButtonActive: {
    backgroundColor: colors.secondary,
  },
  compactFilterText: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: fontWeights.semibold,
  },
  compactFilterTextActive: {
    color: "#ffffff",
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
  providerList: {
    gap: 12,
  },
  providerListEmpty: {
    paddingHorizontal: 24,
  },
  providerContainer: {
    display: "flex",
    flexDirection: "column",
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
