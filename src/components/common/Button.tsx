import { Pressable, StyleSheet, Text, type PressableProps } from "react-native";
import { colors } from "../../theme/colors";
import { fontWeights } from "../../theme/fonts";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = PressableProps & {
  buttonText: string;
  variant?: ButtonVariant;
};

export function Button({
  buttonText,
  variant = "secondary",
  disabled,
  style,
  ...pressableProps
}: ButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <Pressable
      {...pressableProps}
      disabled={disabled}
      style={(state) => [
        styles.button,
        isPrimary ? styles.primaryButton : styles.secondaryButton,
        state.pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        typeof style === "function" ? style(state) : style,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          isPrimary ? styles.primaryText : styles.secondaryText,
        ]}
      >
        {buttonText}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  primaryButton: {
    backgroundColor: colors.secondary,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderColor: colors.primary,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: fontWeights.bold,
  },
  primaryText: {
    color: colors.primary,
  },
  secondaryText: {
    color: colors.primary,
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.5,
  },
});
