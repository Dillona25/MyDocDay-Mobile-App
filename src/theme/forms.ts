import { colors } from "./colors";
import { fonts, fontWeights } from "./fonts";

export const label = {
  alignSelf: "flex-start",
  backgroundColor: "#f4f7fa",
  color: colors.primary,
  fontFamily: fonts.body,
  fontSize: 14,
  fontWeight: fontWeights.semibold,
  marginBottom: -9,
  marginLeft: 12,
  paddingHorizontal: 5,
  zIndex: 1,
} as const;

export const textInput = {
  backgroundColor: "#ffffff",
  borderColor: "#d9e1ea",
  borderRadius: 8,
  borderWidth: 1,
  color: colors.primary,
  fontFamily: fonts.body,
  fontSize: 16,
  paddingHorizontal: 14,
  paddingBottom: 12,
  paddingTop: 16,
} as const;

export const field = {
  flex: 1,
  minWidth: 0,
} as const;

export const fieldStack = {
  gap: 6,
} as const;

export const segmentedRow = {
  flexDirection: "row",
  gap: 8,
} as const;

export const optionButton = {
  alignItems: "center",
  backgroundColor: "#ffffff",
  borderColor: "#d9e1ea",
  borderRadius: 8,
  borderWidth: 1,
  flex: 1,
  justifyContent: "center",
  minHeight: 46,
  paddingVertical: 12,
} as const;

export const optionButtonActive = {
  backgroundColor: colors.secondary,
  borderColor: colors.secondary,
} as const;

export const optionButtonText = {
  color: colors.primary,
  fontFamily: fonts.body,
  fontSize: 14,
  fontWeight: fontWeights.semibold,
} as const;

export const optionButtonTextActive = {
  color: "#ffffff",
} as const;

export const submitButton = {
  alignItems: "center",
  backgroundColor: colors.primary,
  borderRadius: 8,
  paddingVertical: 14,
} as const;

export const submitButtonText = {
  color: "#ffffff",
  fontFamily: fonts.body,
  fontSize: 16,
  fontWeight: fontWeights.semibold,
} as const;
