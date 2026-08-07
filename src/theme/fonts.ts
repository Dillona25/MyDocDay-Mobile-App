export const fonts = {
  heading: "Poppins",
  body: "Inter",
  fallback: "System",
} as const;

export const fontWeights = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export type AppFont = keyof typeof fonts;
export type AppFontWeight = keyof typeof fontWeights;