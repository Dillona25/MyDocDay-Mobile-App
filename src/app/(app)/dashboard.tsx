import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function DashboardScreen() {
  const { firstName } = useLocalSearchParams<{ firstName?: string }>();
  const displayName = firstName || "there";

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>Dashboard</Text>
        <Text style={styles.title}>Welcome, {displayName}.</Text>
        <Text style={styles.description}>
          This is where appointments, providers, reminders, and care notes will
          come together.
        </Text>
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
});
