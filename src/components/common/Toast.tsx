import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export type ToastType = "success" | "error";

type ToastProps = {
  visible: boolean;
  message: string;
  type?: ToastType;
  bottomOffset?: number;
};

export default function Toast({
  visible,
  message,
  type = "success",
  bottomOffset = 90,
}: ToastProps) {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animation, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      friction: 9,
      tension: 100,
    }).start();
  }, [visible, animation]);

  const scale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        type === "success" ? styles.successToast : styles.errorToast,
        {
          bottom: bottomOffset,
          opacity: animation,
          transform: [{ scale }],
        },
      ]}
    >
      <View
        style={[
          styles.statusIndicator,
          type === "success" ? styles.successIndicator : styles.errorIndicator,
        ]}
      />

      <View style={styles.messageContainer}>
        <Text style={styles.title}>
          {type === "success" ? "Success" : "Something went wrong"}
        </Text>

        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 16,
    right: 16,

    flexDirection: "row",
    alignItems: "center",

    paddingVertical: 12,
    paddingHorizontal: 14,

    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,

    zIndex: 999,

    // iOS
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,

    // Android
    elevation: 5,
  },

  successToast: {
    borderColor: "#BBE4C2",
  },

  errorToast: {
    borderColor: "#F1B8B8",
  },

  statusIndicator: {
    width: 4,
    height: 32,
    borderRadius: 4,
    marginRight: 12,
  },

  successIndicator: {
    backgroundColor: "#22A447",
  },

  errorIndicator: {
    backgroundColor: "#D64545",
  },

  messageContainer: {
    flex: 1,
  },

  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },

  message: {
    fontSize: 13,
    color: "#667085",
    lineHeight: 18,
  },
});
