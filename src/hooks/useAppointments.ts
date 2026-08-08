import { getUserAppointments } from "@/api/appointments/appointments";
import { useAuth } from "@/auth/AuthContext";
import { Appointment } from "@/types/appointment";
import { useCallback, useEffect, useState } from "react";

export function useAppointments() {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingApt, setIsLoadingApt] = useState(false);
  const [aptError, setAptError] = useState("");

  const loadAppointments = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoadingApt(true);
    setAptError("");

    try {
      const data = await getUserAppointments(token);
      setAppointments(data.appointments);
    } catch (requestError) {
      if (requestError instanceof Error) {
        setAptError(requestError.message);
      } else {
        setAptError("Unable to load appointments.");
      }
    } finally {
      setIsLoadingApt(false);
    }
  }, [token]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  return {
    appointments,
    isLoadingApt,
    aptError,
    refreshProviders: loadAppointments,
  };
}
