export const colors = {
  primary: "#1f3557",
  secondary: "#1cb8b2",
} as const;

export type AppColor = keyof typeof colors;