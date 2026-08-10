import type { Appointment } from "@/types/appointment";
import type { Provider } from "@/types/provider";
import * as Calendar from "expo-calendar";

const defaultAppointmentDurationMinutes = 60;
const defaultReminderMinutes = 60;

export async function addAppointmentToCalendar(
  appointment: Appointment,
  provider?: Provider,
) {
  const isCalendarAvailable = await Calendar.isAvailableAsync();

  if (!isCalendarAvailable) {
    throw new Error("A calendar app is not available on this device.");
  }

  const startDate = getAppointmentDateTime(appointment);

  if (Number.isNaN(startDate.getTime())) {
    throw new Error("This appointment does not have a valid date and time.");
  }

  const endDate = new Date(
    startDate.getTime() + defaultAppointmentDurationMinutes * 60 * 1000,
  );
  const location =
    appointment.appointmentType === "in_person"
      ? getProviderAddress(provider)
      : undefined;
  const notes = [
    appointment.doctorName
      ? `Provider or clinic: ${appointment.doctorName}`
      : null,
    appointment.appointmentType === "telehealth" ? "Telehealth visit" : null,
    "Added from MyDocDay.",
  ]
    .filter(Boolean)
    .join("\n");

  return Calendar.createEventInCalendarAsync({
    alarms: [{ relativeOffset: -defaultReminderMinutes }],
    endDate,
    location,
    notes,
    startDate,
    title: appointment.title,
  });
}

function getAppointmentDateTime(appointment: Appointment) {
  const [year, month, day] = appointment.date.slice(0, 10).split("-").map(Number);
  const [hours, minutes] = appointment.startTime.split(":").map(Number);

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function getProviderAddress(provider?: Provider) {
  if (!provider?.streetAddress) {
    return undefined;
  }

  const cityStateZip = [
    provider.city,
    [provider.state, provider.zipCode].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  return [provider.streetAddress, cityStateZip].filter(Boolean).join(", ");
}
