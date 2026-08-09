import { queryClient } from "@/query/query-client";
import { AuthProvider } from "@/store/auth/AuthContext";
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
