import { Button } from "@/components/common/Button";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

const onboardingUrl = "https://mydocday.com/onboarding/";

export default function WelcomeScreen() {
  async function handleCreateAccount() {
    await WebBrowser.openBrowserAsync(onboardingUrl);
  }

  function handleSignIn() {
    router.push("/sign-in");
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Image
          contentFit="contain"
          source={require("../../assets/welcomegraphic.svg")}
          style={styles.graphic}
        />

        <View style={styles.copyGroup}>
          <Text style={styles.eyebrow}>MyDocDay</Text>
          <Text style={styles.title}>Your healthcare in one place.</Text>
          <Text style={styles.description}>
            Track appointments, providers, reminders, and care notes for
            yourself and the family members you support.
          </Text>
        </View>

        <View style={styles.actions}>
          <Button buttonText="Sign in" onPress={handleSignIn} variant="primary" />
          <Button
            buttonText="Create account"
            onPress={handleCreateAccount}
            variant="secondary"
          />
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
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  graphic: {
    alignSelf: "center",
    height: 250,
    marginBottom: 30,
    width: "100%",
  },
  copyGroup: {
    alignItems: "center",
  },
  eyebrow: {
    color: colors.secondary,
    fontFamily: fonts.heading,
    fontSize: 15,
    fontWeight: fontWeights.bold,
    letterSpacing: 0,
    marginBottom: 12,
  },
  title: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 38,
    fontWeight: fontWeights.bold,
    lineHeight: 44,
    maxWidth: 330,
    textAlign: "center",
  },
  description: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 25,
    marginTop: 18,
    maxWidth: 330,
    textAlign: "center",
  },
  actions: {
    gap: 14,
    marginTop: 44,
  },
});
