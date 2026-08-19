import { HapticButton } from "@/components/common/HapticButton";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type RemoveFamilyMemberModalProps = {
  displayName: string;
  isRemoving: boolean;
  onClose: () => void;
  onConfirm: () => void;
  visible: boolean;
};

export function RemoveFamilyMemberModal({
  displayName,
  isRemoving,
  onClose,
  onConfirm,
  visible,
}: RemoveFamilyMemberModalProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={isRemoving ? undefined : onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <Pressable
        accessibilityViewIsModal
        onPress={isRemoving ? undefined : onClose}
        style={styles.backdrop}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={styles.modal}
        >
          <View style={styles.warningMark}>
            <Text style={styles.warningMarkText}>!</Text>
          </View>
          <Text style={styles.title}>Remove {displayName}?</Text>
          <Text style={styles.description}>
            This removes them from your active family list. Their record and
            existing care history remain archived.
          </Text>
          <View style={styles.actionRow}>
            <HapticButton
              disabled={isRemoving}
              onPress={onClose}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </HapticButton>
            <HapticButton
              disabled={isRemoving}
              onPress={onConfirm}
              style={[styles.removeButton, isRemoving ? styles.disabled : null]}
            >
              <Text style={styles.removeButtonText}>
                {isRemoving ? "Removing..." : "Remove"}
              </Text>
            </HapticButton>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(11, 25, 45, 0.62)",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  modal: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    maxWidth: 420,
    padding: 24,
    width: "100%",
  },
  warningMark: {
    alignItems: "center",
    backgroundColor: "#fff1f1",
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  warningMarkText: {
    color: "#d24747",
    fontFamily: fonts.heading,
    fontSize: 26,
    fontWeight: fontWeights.bold,
  },
  title: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 21,
    fontWeight: fontWeights.bold,
    marginTop: 16,
    textAlign: "center",
  },
  description: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    textAlign: "center",
  },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 22, width: "100%" },
  cancelButton: {
    alignItems: "center",
    borderColor: "rgba(31, 53, 87, 0.16)",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  cancelButtonText: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: fontWeights.semibold,
  },
  removeButton: {
    alignItems: "center",
    backgroundColor: "#d24747",
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  removeButtonText: {
    color: "#ffffff",
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: fontWeights.semibold,
  },
  disabled: { opacity: 0.65 },
});
