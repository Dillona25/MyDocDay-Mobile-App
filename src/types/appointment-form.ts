export type AppointmentFormData = {
  title: string;
  date: string;
  startTime: string;
  appointmentType: "in_person" | "telehealth" | "";
  providerSelection: "saved" | "other" | "";
  providerId: string;
  doctorName: string;
  location: string;
};

export type AppointmentProviderSelection = AppointmentFormData["providerSelection"];
