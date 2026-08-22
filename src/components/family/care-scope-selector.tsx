/*
 * Displays the active family scope and lets users switch it from any overview.
 */

import { getCareMemberImageSource } from "@/api/care-members/care-members";
import { getUserProfileImageSource } from "@/api/users/profile";
import { HapticButton } from "@/components/common/HapticButton";
import { useAuth } from "@/store/auth/AuthContext";
import { useCareScope, type CareScope } from "@/store/care-scope/CareScopeContext";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import type { ImageSource } from "expo-image";
import { Image } from "expo-image";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

// Keeps the same compact selector behavior across every primary app screen.
export function CareScopeSelector() {
  const { token, user } = useAuth();
  const { careMembers, label, scope, setScope } = useCareScope();
  const [isOpen, setIsOpen] = useState(false);

  if (careMembers.length === 0) {
    return null;
  }

  const ownerName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  return (
    <>
      <HapticButton
        accessibilityLabel={`Viewing care for ${label}`}
        accessibilityRole="button"
        onPress={() => setIsOpen(true)}
        style={styles.trigger}
      >
        <View style={styles.triggerCopy}>
          <Text style={styles.triggerEyebrow}>Viewing care for</Text>
          <Text numberOfLines={1} style={styles.triggerLabel}>
            {label}
          </Text>
        </View>
        <Image
          contentFit="contain"
          source={require("../../assets/caret-right-solid-full.svg")}
          style={styles.triggerCaret}
        />
      </HapticButton>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
        statusBarTranslucent
        transparent
        visible={isOpen}
      >
        <Pressable onPress={() => setIsOpen(false)} style={styles.backdrop}>
          <Pressable
            accessibilityViewIsModal
            onPress={(event) => event.stopPropagation()}
            style={styles.modal}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHeadingCopy}>
                <Text style={styles.modalEyebrow}>Family view</Text>
                <Text style={styles.modalTitle}>Whose care do you want to see?</Text>
              </View>
              <HapticButton
                accessibilityLabel="Close family filter"
                onPress={() => setIsOpen(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>x</Text>
              </HapticButton>
            </View>

            <ScrollView
              contentContainerStyle={styles.optionList}
              showsVerticalScrollIndicator={false}
            >
              <ScopeOption
                initials="ALL"
                isSelected={scope.type === "all"}
                label="Everyone"
                onPress={() => selectScope({ type: "all" })}
                subtitle="Your care and every family member"
              />
              <ScopeOption
                imageSource={getUserProfileImageSource(
                  user?.profileImageUrl,
                  token,
                )}
                initials={getInitials(user?.firstName, user?.lastName)}
                isSelected={scope.type === "self"}
                label={user?.firstName || "Account owner"}
                onPress={() => selectScope({ type: "self" })}
                subtitle={ownerName || "Account owner"}
              />
              {careMembers.map((member) => (
                <ScopeOption
                  imageSource={getCareMemberImageSource(
                    member.profileImageUrl,
                    token,
                  )}
                  initials={getInitials(member.firstName, member.lastName)}
                  isSelected={
                    scope.type === "member" &&
                    scope.careMemberId === member.id
                  }
                  key={member.id}
                  label={member.firstName}
                  onPress={() =>
                    selectScope({ type: "member", careMemberId: member.id })
                  }
                  subtitle={member.relationship}
                />
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );

  // Applies the selection app-wide and closes the modal in one interaction.
  function selectScope(nextScope: CareScope) {
    setScope(nextScope);
    setIsOpen(false);
  }
}

// Renders one accessible person option with image, context, and selected state.
function ScopeOption({
  imageSource,
  initials,
  isSelected,
  label,
  onPress,
  subtitle,
}: {
  imageSource?: ImageSource | null;
  initials: string;
  isSelected: boolean;
  label: string;
  onPress: () => void;
  subtitle: string;
}) {
  return (
    <HapticButton
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={[styles.option, isSelected ? styles.optionSelected : null]}
    >
      {imageSource ? (
        <Image contentFit="cover" source={imageSource} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarText}>{initials || "?"}</Text>
        </View>
      )}
      <View style={styles.optionCopy}>
        <Text numberOfLines={1} style={styles.optionLabel}>
          {label}
        </Text>
        <Text numberOfLines={1} style={styles.optionSubtitle}>
          {subtitle}
        </Text>
      </View>
      <View style={[styles.radio, isSelected ? styles.radioSelected : null]}>
        {isSelected ? <View style={styles.radioDot} /> : null}
      </View>
    </HapticButton>
  );
}

// Builds compact initials for owner and family avatar fallbacks.
function getInitials(firstName?: string | null, lastName?: string | null) {
  return `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`.toUpperCase();
}

const styles = StyleSheet.create({
  trigger: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "rgba(31, 53, 87, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 58,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  triggerCopy: { flex: 1, minWidth: 0 },
  triggerEyebrow: {
    color: "#7b8798",
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: fontWeights.semibold,
    textTransform: "uppercase",
  },
  triggerLabel: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 16,
    fontWeight: fontWeights.semibold,
    marginTop: 1,
  },
  triggerCaret: {
    height: 12,
    tintColor: "#8a96a8",
    transform: [{ rotate: "90deg" }],
    width: 12,
  },
  backdrop: {
    backgroundColor: "rgba(11, 25, 45, 0.62)",
    flex: 1,
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    maxHeight: "78%",
    paddingBottom: 34,
    paddingHorizontal: 22,
    paddingTop: 22,
  },
  modalHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
  },
  modalHeadingCopy: { flex: 1, minWidth: 0 },
  modalEyebrow: {
    color: colors.secondary,
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: fontWeights.bold,
    textTransform: "uppercase",
  },
  modalTitle: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 21,
    fontWeight: fontWeights.bold,
    lineHeight: 27,
    marginTop: 3,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: "#f4f7fa",
    borderColor: "rgba(31, 53, 87, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  closeButtonText: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 18,
    lineHeight: 20,
  },
  optionList: { gap: 8, marginTop: 20 },
  option: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "rgba(31, 53, 87, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 68,
    padding: 10,
  },
  optionSelected: {
    backgroundColor: "rgba(28, 184, 178, 0.08)",
    borderColor: colors.secondary,
  },
  avatar: { borderRadius: 8, height: 46, width: 46 },
  avatarFallback: {
    alignItems: "center",
    backgroundColor: "rgba(31, 53, 87, 0.12)",
    borderRadius: 8,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  avatarText: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: fontWeights.bold,
  },
  optionCopy: { flex: 1, minWidth: 0 },
  optionLabel: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 15,
    fontWeight: fontWeights.semibold,
  },
  optionSubtitle: {
    color: "#7b8798",
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  radio: {
    alignItems: "center",
    borderColor: "#a6b1c0",
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  radioSelected: { borderColor: colors.secondary },
  radioDot: {
    backgroundColor: colors.secondary,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
});
