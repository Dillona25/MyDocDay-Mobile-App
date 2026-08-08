import { useAuth } from "@/auth/AuthContext";
import { AppointmentWidget } from "@/components/appointments/appointment-widget";
import { UserBar } from "@/components/dashboard/user-bar";
import { ProviderWidget } from "@/components/providers/provider-widget";
import { useProviders } from "@/hooks/useProviders";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import { router } from "expo-router";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const MAX_VISIBLE_PROVIDERS = 4;

export default function DashboardScreen() {
  const { user } = useAuth();
  const { error, isLoading, providers } = useProviders();
  const visibleProviders = providers.slice(0, MAX_VISIBLE_PROVIDERS);
  const hasMoreProviders = providers.length > MAX_VISIBLE_PROVIDERS;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <UserBar user={user} />

        <View style={styles.widgetContent}>
          <AppointmentWidget />

          <View style={styles.dashboardCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Providers</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/providers")}
                style={styles.addButton}
              >
                <Text style={styles.addButtonText}>+</Text>
              </Pressable>
            </View>

            <View style={styles.providerList}>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              {isLoading ? (
                <Text style={styles.helperText}>Loading providers...</Text>
              ) : null}
              {!isLoading &&
                !error &&
                visibleProviders.map((provider) => (
                  <View key={provider.id} style={styles.providerContainer}>
                    <ProviderWidget provider={provider} />
                  </View>
                ))}
            </View>

            {hasMoreProviders ? (
              <Pressable
                onPress={() => router.push("/providers")}
                style={styles.footerButton}
              >
                <Text style={styles.footerButtonText}>View all providers</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f4f7fa",
  },
  content: {
    gap: 18,
    paddingTop: 0,
    paddingBottom: 32,
  },
  widgetContent: {
    gap: 18,
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
    marginBottom: 14,
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
  providerList: {
    gap: 12,
  },
  providerContainer: {
    display: "flex",
    flexDirection: "column",
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
