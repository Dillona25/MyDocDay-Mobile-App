import { useAuth } from "@/auth/AuthContext";
import { ProviderWidget } from "@/components/providers/provider-widget";
import { useProviders } from "@/hooks/useProviders";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function DashboardScreen() {
  const { user } = useAuth();
  const { error, isLoading, providers } = useProviders();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>Dashboard</Text>
        <Text style={styles.title}>Welcome, {user?.firstName}.</Text>
        <Text style={styles.description}>
          This is where appointments, providers, reminders, and care notes will
          come together.
        </Text>
        <Text style={styles.helperText}>
          {isLoading
            ? "Loading providers..."
            : `${providers.length} providers loaded.`}
        </Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {providers.map((provider) => (
          <ProviderWidget key={provider.id} provider={provider} />
        ))}
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
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  eyebrow: {
    color: colors.secondary,
    fontFamily: fonts.heading,
    fontSize: 15,
    fontWeight: fontWeights.bold,
    marginBottom: 12,
    textAlign: "center",
  },
  title: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 36,
    fontWeight: fontWeights.bold,
    lineHeight: 42,
    textAlign: "center",
  },
  description: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 25,
    marginTop: 18,
    textAlign: "center",
  },
  helperText: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: 18,
    textAlign: "center",
  },
  errorText: {
    color: "#d24747",
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
  },
});
