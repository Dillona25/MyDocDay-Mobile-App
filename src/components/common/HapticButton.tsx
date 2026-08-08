import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, type PressableProps } from "react-native";

interface HapticButtonProps extends PressableProps {
  children: React.ReactNode;
  hapticStyle?: Haptics.ImpactFeedbackStyle;
}

export function HapticButton({
  children,
  onPress,
  hapticStyle = Haptics.ImpactFeedbackStyle.Light,
  ...props
}: HapticButtonProps) {
  const handlePress = (event: any) => {
    // 1. Trigger haptic
    Haptics.impactAsync(hapticStyle);

    // 2. Run original onPress if it exists
    if (onPress) {
      onPress(event);
    }
  };

  return (
    <Pressable onPress={handlePress} {...props}>
      {children}
    </Pressable>
  );
}
