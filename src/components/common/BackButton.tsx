import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import { router, type Href } from "expo-router";
import { StyleSheet, Text } from "react-native";

import { HapticButton } from "./HapticButton";

type BackButtonProps = {
  fallbackHref: Href;
};

export function BackButton({ fallbackHref }: BackButtonProps) {
  function goBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallbackHref);
  }

  return (
    <HapticButton
      accessibilityLabel="Go back"
      accessibilityRole="button"
      hitSlop={8}
      onPress={goBack}
      style={styles.button}
    >
      <Text aria-hidden style={styles.arrow}>
        ←
      </Text>
      <Text style={styles.label}>Back</Text>
    </HapticButton>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 5,
    minHeight: 34,
    paddingRight: 8,
  },
  arrow: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 18,
    lineHeight: 21,
  },
  label: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: fontWeights.semibold,
  },
});
