import { getCareMemberImageSource } from "@/api/care-members/care-members";
import { HapticButton } from "@/components/common/HapticButton";
import { useAuth } from "@/store/auth/AuthContext";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import type { CareMember } from "@/types/care-member";
import { Image } from "expo-image";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

type FamilyMemberCardProps = {
  careMember: CareMember;
  returnTo?: string;
  variant?: "compact" | "full";
};

export function FamilyMemberCard({
  careMember,
  returnTo,
  variant = "compact",
}: FamilyMemberCardProps) {
  const { token } = useAuth();
  const displayName = [careMember.firstName, careMember.lastName]
    .filter(Boolean)
    .join(" ");
  const initials = `${careMember.firstName.charAt(0)}${careMember.lastName?.charAt(0) ?? ""}`.toUpperCase();
  const imageSource = getCareMemberImageSource(
    careMember.profileImageUrl,
    token,
  );

  return (
    <HapticButton
      accessibilityLabel={`View ${displayName}`}
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: "/family/[careMemberId]",
          params: {
            careMemberId: careMember.id,
            ...(returnTo ? { returnTo } : {}),
          },
        })
      }
      style={({ pressed }) => [
        styles.card,
        variant === "full" ? styles.fullCard : null,
        pressed ? styles.cardPressed : null,
      ]}
    >
      {imageSource ? (
        <Image
          accessibilityLabel={displayName}
          contentFit="cover"
          source={imageSource}
          style={[styles.avatar, variant === "full" ? styles.fullAvatar : null]}
        />
      ) : (
        <View
          style={[
            styles.avatar,
            styles.avatarFallback,
            variant === "full" ? styles.fullAvatar : null,
          ]}
        >
          <Text
            style={[
              styles.avatarText,
              variant === "full" ? styles.fullAvatarText : null,
            ]}
          >
            {initials || "?"}
          </Text>
        </View>
      )}

      <View style={styles.copy}>
        <Text style={styles.eyebrow}>Family member</Text>
        <Text
          numberOfLines={1}
          style={[
            styles.name,
            variant === "full" ? styles.fullName : null,
          ]}
        >
          {displayName}
        </Text>
        <Text numberOfLines={1} style={styles.relationship}>
          {careMember.relationship}
        </Text>
      </View>

      <Image
        contentFit="contain"
        source={require("../../assets/caret-right-solid-full.svg")}
        style={styles.caret}
      />
    </HapticButton>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: "rgba(31, 53, 87, 0.08)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 76,
    padding: 14,
  },
  fullCard: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(31, 53, 87, 0.14)",
    elevation: 3,
    minHeight: 94,
    padding: 18,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  avatar: {
    borderRadius: 8,
    height: 48,
    width: 48,
  },
  avatarFallback: {
    alignItems: "center",
    backgroundColor: "rgba(31, 53, 87, 0.15)",
    justifyContent: "center",
  },
  fullAvatar: {
    height: 60,
    width: 60,
  },
  avatarText: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: fontWeights.semibold,
  },
  fullAvatarText: {
    fontSize: 18,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: colors.secondary,
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: fontWeights.semibold,
    textTransform: "uppercase",
  },
  name: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 16,
    fontWeight: fontWeights.semibold,
    marginTop: 2,
  },
  fullName: {
    fontSize: 19,
    marginTop: 4,
  },
  relationship: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 13,
    marginTop: 2,
  },
  caret: {
    height: 11,
    tintColor: "#8a96a8",
    width: 11,
  },
});
