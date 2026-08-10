import type { SignedInUser } from "@/api/auth/sign-in";
import { getUserProfileImageSource } from "@/api/users/profile";
import { HapticButton } from "@/components/common/HapticButton";
import { useAuth } from "@/store/auth/AuthContext";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import { Image } from "expo-image";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

type UserBarProps = {
  user: SignedInUser | null;
};

function getInitials(user: SignedInUser | null) {
  if (!user) {
    return "?";
  }

  return `${user.firstName?.charAt(0) ?? ""}${user.lastName?.charAt(0) ?? ""}`.toUpperCase();
}

export function UserBar({ user }: UserBarProps) {
  const { token } = useAuth();
  const profileImageSource = getUserProfileImageSource(
    user?.profileImageUrl,
    token,
  );

  return (
    <View style={styles.container}>
      <HapticButton
        accessibilityLabel="Open account"
        accessibilityRole="button"
        onPress={() => router.push("/account")}
        style={styles.userInfo}
      >
        <View style={styles.avatar}>
          {profileImageSource ? (
            <Image
              contentFit="cover"
              source={profileImageSource}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarText}>{getInitials(user)}</Text>
          )}
        </View>

        <View style={styles.greetingGroup}>
          <Text style={styles.greeting}>Hi, welcome back!</Text>
          <Text numberOfLines={1} style={styles.userName}>
            {user?.firstName}
          </Text>
        </View>
        <View style={styles.caretFrame}>
          <Image
            contentFit="contain"
            source={require("../../assets/caret-right-solid-full.svg")}
            style={styles.caretIcon}
          />
        </View>
      </HapticButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  userInfo: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    minWidth: 0,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "rgba(28, 184, 178, 0.18)",
    borderColor: "rgba(31, 53, 87, 0.08)",
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    overflow: "hidden",
    width: 48,
  },
  avatarText: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 17,
    fontWeight: fontWeights.bold,
  },
  avatarImage: {
    height: "100%",
    width: "100%",
  },
  greetingGroup: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },
  greeting: {
    color: colors.secondary,
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: fontWeights.medium,
  },
  userName: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 18,
    fontWeight: fontWeights.semibold,
    marginTop: 2,
  },
  caretFrame: {
    alignItems: "center",
    backgroundColor: "#f4f7fa",
    borderColor: "#d9e1ea",
    borderRadius: 6,
    borderWidth: 1,
    height: 26,
    justifyContent: "center",
    marginLeft: 12,
    width: 26,
  },
  caretIcon: {
    height: 12,
    tintColor: "#8a96a8",
    width: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginLeft: 12,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "rgba(28, 184, 178, 0.16)",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  notificationIcon: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  bellDome: {
    borderColor: colors.primary,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 2,
    height: 14,
    width: 14,
  },
  bellBase: {
    backgroundColor: colors.primary,
    borderRadius: 1,
    height: 2,
    marginTop: -1,
    width: 18,
  },
  bellClapper: {
    backgroundColor: colors.primary,
    borderRadius: 2,
    height: 4,
    marginTop: 1,
    width: 4,
  },
  notificationDot: {
    backgroundColor: colors.secondary,
    borderColor: "#ffffff",
    borderRadius: 4,
    borderWidth: 1,
    height: 8,
    position: "absolute",
    right: 3,
    top: 2,
    width: 8,
  },
  settingsIcon: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  gearOuter: {
    alignItems: "center",
    borderColor: colors.primary,
    borderRadius: 8,
    borderWidth: 2,
    height: 16,
    justifyContent: "center",
    width: 16,
  },
  gearInner: {
    borderColor: colors.primary,
    borderRadius: 3,
    borderWidth: 2,
    height: 6,
    width: 6,
  },
  gearTooth: {
    backgroundColor: colors.primary,
    borderRadius: 1,
    height: 4,
    position: "absolute",
    width: 2,
  },
  gearToothTop: {
    top: 1,
  },
  gearToothRight: {
    right: 1,
    transform: [{ rotate: "90deg" }],
  },
  gearToothBottom: {
    bottom: 1,
  },
  gearToothLeft: {
    left: 1,
    transform: [{ rotate: "90deg" }],
  },
});
