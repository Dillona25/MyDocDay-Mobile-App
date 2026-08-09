import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { HapticButton } from "./HapticButton";

type PickerModalProps = {
  children: ReactNode;
  onClose: () => void;
  onDone: () => void;
  title: string;
  visible: boolean;
};

export function PickerModal({
  children,
  onClose,
  onDone,
  title,
  visible,
}: PickerModalProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <Pressable onPress={onClose} style={styles.backdropDismiss} />
        <View accessibilityViewIsModal style={styles.modal}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.pickerContent}>{children}</View>
          <HapticButton onPress={onDone} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Done</Text>
          </HapticButton>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(11, 25, 45, 0.42)",
    flex: 1,
    justifyContent: "flex-end",
  },
  backdropDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  modal: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingBottom: 28,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  title: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 18,
    fontWeight: fontWeights.semibold,
    textAlign: "center",
  },
  pickerContent: {
    minHeight: 56,
  },
  doneButton: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 48,
  },
  doneButtonText: {
    color: "#ffffff",
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: fontWeights.semibold,
  },
});
