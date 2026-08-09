import { AuthProvider } from "@/auth/AuthContext";
import { queryClient } from "@/query/query-client";
import { ToastProvider } from "@/store/ToastContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <Stack />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
