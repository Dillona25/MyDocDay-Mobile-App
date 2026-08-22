import { HapticButton } from "@/components/common/HapticButton";
import { CareScopeSelector } from "@/components/family/care-scope-selector";
import { ProviderWidget } from "@/components/providers/provider-widget";
import { useProviders } from "@/hooks/useProviders";
import { useCareScope } from "@/store/care-scope/CareScopeContext";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import type { ProviderType } from "@/types/provider";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const providerFilters: { label: string; value: ProviderType }[] = [
  { label: "Providers", value: "provider" },
  { label: "Clinics", value: "clinic" },
];

export default function ProvidersScreen() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const { matchesProvider } = useCareScope();
  const { error, isLoading, providers } = useProviders();
  const [activeFilter, setActiveFilter] = useState<ProviderType>("provider");

  useFocusEffect(
    useCallback(() => {
      setActiveFilter(filter === "clinic" ? "clinic" : "provider");

      return () => {
        setActiveFilter("provider");
      };
    }, [filter]),
  );

  const filteredProviders = providers.filter(
    (provider) =>
      provider.type === activeFilter && matchesProvider(provider),
  );

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Care Team</Text>
          <Text style={styles.title}>Your Providers</Text>
          <Text style={styles.description}>
            View and manage your care team!
          </Text>
        </View>

        <CareScopeSelector />

        <View style={styles.filterRow}>
          {providerFilters.map((filter) => {
            const isActive = filter.value === activeFilter;

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

        {isLoading ? (
          <Text style={styles.helperHeader}>Loading providers...</Text>
        ) : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.providerList}>
          {!isLoading && !error && filteredProviders.length === 0 ? (
            <View>
              <Text style={styles.helperHeader}>
                {activeFilter === "provider"
                  ? "No providers found."
                  : "No clinics found."}
              </Text>
              <Text style={styles.emptyText}>
                Use the + button to add your first {activeFilter}. It will
                appear here.
              </Text>
            </View>
          ) : null}
          {filteredProviders.map((provider) => (
            <ProviderWidget
              key={provider.id}
              provider={provider}
              variant="full"
            />
          ))}
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
    padding: 24,
    paddingBottom: 32,
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
  providerList: {
    gap: 12,
  },
  helperHeader: {
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
  errorText: {
    color: "#d24747",
    fontFamily: fonts.body,
    fontSize: 14,
  },
});
