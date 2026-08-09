import { appointmentTypes } from "@/data/appointmentTypes";
import { useCreateAppointment } from "@/hooks/useCreateAppointment";
import { useProviders } from "@/hooks/useProviders";
import { useAuth } from "@/store/auth/AuthContext";
import { useToast } from "@/store/ToastContext";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import {
  field,
  fieldStack,
  label,
  optionButton,
  optionButtonActive,
  optionButtonText,
  optionButtonTextActive,
  segmentedRow,
  submitButton,
  submitButtonText,
  textInput,
} from "@/theme/forms";
import type {
  AppointmentFormData,
  AppointmentProviderSelection,
} from "@/types/appointment-form";
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { HapticButton } from "../common/HapticButton";

const otherDoctorValue = "other";

const providerOptions = [
  { label: "Saved Provider", value: "saved" },
  { label: "Different Provider", value: otherDoctorValue },
] as const;

type ActivePicker = "date" | "time" | null;

function formatDateForApi(date: Date) {
  return [
    date.getFullYear(),
    (date.getMonth() + 1).toString().padStart(2, "0"),
    date.getDate().toString().padStart(2, "0"),
  ].join("-");
}

function formatTimeForApi(date: Date) {
  return [
    date.getHours().toString().padStart(2, "0"),
    date.getMinutes().toString().padStart(2, "0"),
  ].join(":");
}

function formatDateForDisplay(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeForDisplay(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function createInitialAppointmentFormData(date: Date): AppointmentFormData {
  return {
    title: "",
    date: formatDateForApi(date),
    startTime: formatTimeForApi(date),
    appointmentType: "",
    providerSelection: "",
    providerId: "",
    doctorName: "",
  };
}

export default function AddAppointmentForm() {
  const { error, isLoading, providers } = useProviders();
  const { token } = useAuth();
  const createAppointmentMutation = useCreateAppointment();
  const { showToast } = useToast();
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedTime, setSelectedTime] = useState(() => new Date());
  const [formData, setFormData] = useState(() =>
    createInitialAppointmentFormData(new Date()),
  );
  const selectedProviderMode = formData.providerSelection;

  useFocusEffect(
    useCallback(() => {
      return () => {
        const nextDate = new Date();

        setSelectedDate(nextDate);
        setSelectedTime(nextDate);
        setActivePicker(null);
        setFormData(createInitialAppointmentFormData(nextDate));
      };
    }, []),
  );

  function updateField(fieldName: keyof AppointmentFormData, value: string) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [fieldName]: value,
    }));
  }

  function chooseProviderMode(mode: AppointmentProviderSelection) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      providerSelection: mode,
      providerId: "",
      doctorName: "",
    }));
  }

  function updateSelectedDate(date: Date) {
    setSelectedDate(date);
    updateField("date", formatDateForApi(date));
    setActivePicker(null);
  }

  function updateSelectedTime(date: Date) {
    setSelectedTime(date);
    updateField("startTime", formatTimeForApi(date));
    setActivePicker(null);
  }

  function openPicker(mode: Exclude<ActivePicker, null>) {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: mode === "date" ? selectedDate : selectedTime,
        mode,
        is24Hour: false,
        onChange: (event, date) => {
          if (event.type !== "set" || !date) {
            return;
          }

          if (mode === "date") {
            updateSelectedDate(date);
          } else {
            updateSelectedTime(date);
          }
        },
      });
      return;
    }

    setActivePicker((currentPicker) => (currentPicker === mode ? null : mode));
  }

  async function onSubmitPress(formData: AppointmentFormData) {
    if (!token) {
      return;
    }

    try {
      await createAppointmentMutation.mutateAsync([
        {
          title: formData.title,
          date: formData.date,
          startTime: formData.startTime,
          appointmentType: formData.appointmentType || "in_person",
          providerId:
            formData.providerSelection === "saved" && formData.providerId
              ? Number(formData.providerId)
              : undefined,
          doctorName:
            formData.providerSelection === otherDoctorValue
              ? formData.doctorName
              : undefined,
        },
        token,
      ]);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Appointment added successfully", "success");
      const nextDate = new Date();

      setSelectedDate(nextDate);
      setSelectedTime(nextDate);
      setActivePicker(null);
      setFormData(createInitialAppointmentFormData(nextDate));
    } catch (requestError) {
      console.log(requestError);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast("Something went wrong with the request", "error");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.form}>
      <FloatingInput
        labelText="Appointment Title"
        onChangeText={(value) => updateField("title", value)}
        value={formData.title}
      />

      <View style={styles.dateTimeGroup}>
        <View style={styles.dateTimeRow}>
          <DateTimeTrigger
            displayValue={formatDateForDisplay(selectedDate)}
            isActive={activePicker === "date"}
            labelText="Date"
            onPress={() => openPicker("date")}
          />
          <DateTimeTrigger
            displayValue={formatTimeForDisplay(selectedTime)}
            isActive={activePicker === "time"}
            labelText="Start Time"
            onPress={() => openPicker("time")}
          />
        </View>

        {activePicker === "date" ? (
          <NativeDateTimePickerPanel
            mode="date"
            onChange={updateSelectedDate}
            value={selectedDate}
          />
        ) : null}

        {activePicker === "time" ? (
          <NativeDateTimePickerPanel
            mode="time"
            onChange={updateSelectedTime}
            value={selectedTime}
          />
        ) : null}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.groupLabel}>Appointment Type</Text>
        <View style={segmentedRow}>
          {appointmentTypes.map((typeOption) => {
            const isActive = formData.appointmentType === typeOption.value;

            return (
              <HapticButton
                key={typeOption.value}
                onPress={() => updateField("appointmentType", typeOption.value)}
                style={[optionButton, isActive ? optionButtonActive : null]}
              >
                <Text
                  style={[
                    optionButtonText,
                    isActive ? optionButtonTextActive : null,
                  ]}
                >
                  {typeOption.label}
                </Text>
              </HapticButton>
            );
          })}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.groupLabel}>Which Provider or Clinic?</Text>
        <View style={segmentedRow}>
          {providerOptions.map((providerOption) => {
            const isActive = selectedProviderMode === providerOption.value;

            return (
              <HapticButton
                key={providerOption.value}
                onPress={() => chooseProviderMode(providerOption.value)}
                style={[optionButton, isActive ? optionButtonActive : null]}
              >
                <Text
                  style={[
                    optionButtonText,
                    isActive ? optionButtonTextActive : null,
                  ]}
                >
                  {providerOption.label}
                </Text>
              </HapticButton>
            );
          })}
        </View>
      </View>

      {selectedProviderMode === "saved" ? (
        <View style={styles.savedProviderList}>
          {isLoading ? (
            <Text style={styles.helperText}>Loading saved providers...</Text>
          ) : null}
          {error ? <Text style={styles.helperText}>{error}</Text> : null}
          {!isLoading && !error && providers.length === 0 ? (
            <Text style={styles.helperText}>
              No saved providers yet. Choose Different Provider for now.
            </Text>
          ) : null}
          {providers.map((provider) => {
            const providerId = String(provider.id);
            const isActive = formData.providerId === providerId;
            const displayName =
              provider.type === "clinic"
                ? (provider.clinicName ?? "Clinic")
                : [provider.firstName, provider.lastName]
                    .filter(Boolean)
                    .join(" ");
            const providerLabel =
              provider.type === "clinic" ? "Clinic" : "Provider";

            return (
              <HapticButton
                key={provider.id}
                onPress={() => updateField("providerId", providerId)}
                style={[
                  styles.providerOption,
                  isActive ? styles.providerOptionActive : null,
                ]}
              >
                <View style={styles.providerOptionContent}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.providerName,
                      isActive ? styles.providerNameActive : null,
                    ]}
                  >
                    {displayName}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.providerMeta,
                      isActive ? styles.providerMetaActive : null,
                    ]}
                  >
                    {providerLabel}
                    {provider.specialty ? ` - ${provider.specialty}` : ""}
                  </Text>
                </View>
                <View
                  style={[
                    styles.providerRadio,
                    isActive ? styles.providerRadioActive : null,
                  ]}
                />
              </HapticButton>
            );
          })}
        </View>
      ) : null}

      {selectedProviderMode === otherDoctorValue ? (
        <FloatingInput
          labelText="Provider or Clinic Name"
          onChangeText={(value) => updateField("doctorName", value)}
          value={formData.doctorName}
        />
      ) : null}

      <HapticButton
        onPress={() => onSubmitPress(formData)}
        style={submitButton}
      >
        <Text style={submitButtonText}>Add Appointment</Text>
      </HapticButton>
    </ScrollView>
  );
}

type FloatingInputProps = {
  labelText: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
};

function FloatingInput({
  labelText,
  onChangeText,
  placeholder,
  value,
}: FloatingInputProps) {
  return (
    <View style={[field, fieldStack]}>
      <Text style={label}>{labelText}</Text>
      <TextInput
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8a96a8"
        style={textInput}
        value={value}
      />
    </View>
  );
}

type DateTimeTriggerProps = {
  labelText: string;
  displayValue: string;
  isActive: boolean;
  onPress: () => void;
};

function DateTimeTrigger({
  displayValue,
  isActive,
  labelText,
  onPress,
}: DateTimeTriggerProps) {
  return (
    <View style={[field, fieldStack]}>
      <Text style={label}>{labelText}</Text>
      <HapticButton
        onPress={onPress}
        style={[
          styles.pickerTrigger,
          isActive ? styles.pickerTriggerActive : null,
        ]}
      >
        <Text style={styles.pickerTriggerText}>{displayValue}</Text>
      </HapticButton>
    </View>
  );
}

type NativeDateTimePickerPanelProps = {
  mode: "date" | "time";
  value: Date;
  onChange: (date: Date) => void;
};

function NativeDateTimePickerPanel({
  mode,
  onChange,
  value,
}: NativeDateTimePickerPanelProps) {
  function handleChange(event: DateTimePickerEvent, date?: Date) {
    if (event.type === "set" && date) {
      onChange(date);
    }
  }

  return (
    <View style={styles.pickerShell}>
      <DateTimePicker
        display="spinner"
        is24Hour={false}
        mode={mode}
        onChange={handleChange}
        textColor={colors.primary}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 18,
    paddingBottom: 32,
  },
  fieldGroup: {
    gap: 10,
  },
  groupLabel: {
    color: "#536173",
    fontSize: 14,
    fontWeight: "600",
  },
  fieldsRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateTimeGroup: {
    gap: 12,
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 12,
  },
  pickerTrigger: {
    backgroundColor: "#ffffff",
    borderColor: "#d9e1ea",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerTriggerActive: {
    borderColor: colors.secondary,
    borderWidth: 2,
  },
  pickerTriggerText: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: fontWeights.semibold,
  },
  pickerShell: {
    backgroundColor: "#ffffff",
    borderColor: "#d9e1ea",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 54,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  savedProviderList: {
    gap: 10,
  },
  helperText: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  providerOption: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#d9e1ea",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 14,
  },
  providerOptionActive: {
    borderColor: colors.secondary,
    borderWidth: 2,
  },
  providerOptionContent: {
    flex: 1,
    minWidth: 0,
  },
  providerName: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 16,
    fontWeight: fontWeights.semibold,
  },
  providerNameActive: {
    color: colors.primary,
  },
  providerMeta: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 13,
    marginTop: 3,
  },
  providerMetaActive: {
    color: "#536173",
  },
  providerRadio: {
    borderColor: "#cbd5e1",
    borderRadius: 999,
    borderWidth: 2,
    height: 18,
    width: 18,
  },
  providerRadioActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
});
