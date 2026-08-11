import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

type ReminderAlertProps = {
  title: string;
  detail: string;
  timing: string;
};

export function ReminderAlert({
  title,
  detail,
  timing,
}: ReminderAlertProps) {
  return (
    <View style={styles.alert}>
      <View style={styles.iconFrame}>
        <Image
          contentFit="contain"
          source={require("../../assets/bell-solid-full.svg")}
          style={styles.icon}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          <Text style={styles.timing}>{timing}</Text>
        </View>
        <Text numberOfLines={2} style={styles.detail}>
          {detail}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  alert: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
  },
  iconFrame: {
    alignItems: "center",
    backgroundColor: "rgba(28, 184, 178, 0.14)",
    borderRadius: 8,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  icon: {
    height: 16,
    tintColor: colors.secondary,
    width: 16,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  title: {
    color: colors.primary,
    flex: 1,
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: fontWeights.semibold,
  },
  timing: {
    color: colors.secondary,
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: fontWeights.bold,
  },
  detail: {
    color: "#677488",
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
});
