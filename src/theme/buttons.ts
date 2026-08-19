import { colors } from "./colors";
import { fontWeights } from "./fonts";

export const buttonBase = {
  alignItems: "center",
  borderRadius: 8,
  justifyContent: "center",
  minHeight: 48,
  paddingHorizontal: 20,
  paddingVertical: 12,
} as const;

export const buttonPrimary = {
  ...buttonBase,
  backgroundColor: colors.secondary,
} as const;

export const buttonSecondary = {
  ...buttonBase,
  backgroundColor: "transparent",
  borderColor: colors.primary,
  borderWidth: 1,
} as const;

export const buttonSubmit = {
  ...buttonBase,
  backgroundColor: colors.primary,
} as const;

export const buttonDisabled = {
  opacity: 0.5,
} as const;

export const buttonText = {
  color: colors.primary,
  fontSize: 14,
  fontWeight: fontWeights.bold,
} as const;

export const buttonSubmitText = {
  color: "#ffffff",
  fontSize: 14,
  fontWeight: fontWeights.bold,
} as const;
