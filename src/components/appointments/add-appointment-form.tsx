import { PickerModal } from "@/components/common/PickerModal";
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
import { Picker } from "@react-native-picker/picker";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import { type ReactNode, useCallback, useEffect, useState } from "react";
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

const minimumAppointmentDate = new Date(1900, 0, 1);
const maximumAppointmentDate = new Date(2100, 11, 31);

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

function parseAppointmentDate(dateValue: string) {
  const [year, month, day] = dateValue.slice(0, 10).split("-").map(Number);

  return year && month && day ? new Date(year, month - 1, day) : new Date();
}

function parseAppointmentTime(timeValue: string) {
  const [hours, minutes] = timeValue.split(":").map(Number);
  const date = new Date();

  if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
    date.setHours(hours, minutes, 0, 0);
  }

  return date;
}

type AddAppointmentFormProps = {
  footer?: ReactNode;
  initialData?: AppointmentFormData;
  mode?: "create" | "edit";
  onEditSubmit?: (formData: AppointmentFormData) => void | Promise<void>;
};

export default function AddAppointmentForm({
  footer,
  initialData,
  mode = "create",
  onEditSubmit,
}: AddAppointmentFormProps) {
  const [defaultInitialData] = useState(() =>
    createInitialAppointmentFormData(new Date()),
  );
  const resolvedInitialData = initialData ?? defaultInitialData;
  const { error, isLoading, providers } = useProviders();
  const { token } = useAuth();
  const createAppointmentMutation = useCreateAppointment();
  const { showToast } = useToast();
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [selectedDate, setSelectedDate] = useState(() =>
    parseAppointmentDate(resolvedInitialData.date),
  );
  const [selectedTime, setSelectedTime] = useState(() =>
    parseAppointmentTime(resolvedInitialData.startTime),
  );
  const [formData, setFormData] = useState(resolvedInitialData);
  const selectedProviderMode = formData.providerSelection;

  useFocusEffect(
    useCallback(() => {
      return () => {
        const nextDate =
          mode === "edit"
            ? parseAppointmentDate(resolvedInitialData.date)
            : new Date();
        const nextTime =
          mode === "edit"
            ? parseAppointmentTime(resolvedInitialData.startTime)
            : nextDate;

        setSelectedDate(nextDate);
        setSelectedTime(nextTime);
        setActivePicker(null);
        setFormData(
          mode === "edit"
            ? resolvedInitialData
            : createInitialAppointmentFormData(nextDate),
        );
      };
    }, [mode, resolvedInitialData]),
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
  }

  function updateSelectedTime(date: Date) {
    setSelectedTime(date);
    updateField("startTime", formatTimeForApi(date));
  }

  function openPicker(mode: Exclude<ActivePicker, null>) {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: mode === "date" ? selectedDate : selectedTime,
        mode,
        is24Hour: false,
        ...(mode === "date"
          ? {
              minimumDate: minimumAppointmentDate,
              maximumDate: maximumAppointmentDate,
            }
          : {}),
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
    if (mode === "edit") {
      await onEditSubmit?.(formData);
      return;
    }

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
            key="appointment-date-picker"
            mode="date"
            onCancel={() => setActivePicker(null)}
            onChange={updateSelectedDate}
            onDone={() => setActivePicker(null)}
            value={selectedDate}
          />
        ) : null}

        {activePicker === "time" ? (
          <NativeDateTimePickerPanel
            key="appointment-time-picker"
            mode="time"
            onCancel={() => setActivePicker(null)}
            onChange={updateSelectedTime}
            onDone={() => setActivePicker(null)}
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
        <Text style={submitButtonText}>
          {mode === "edit" ? "Save Changes" : "Add Appointment"}
        </Text>
      </HapticButton>

      {footer}
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
  onCancel: () => void;
  onChange: (date: Date) => void;
  onDone: () => void;
};

function NativeDateTimePickerPanel({
  mode,
  onCancel,
  onChange,
  onDone,
  value,
}: NativeDateTimePickerPanelProps) {
  const [draftValue, setDraftValue] = useState(value);

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  function handleChange(event: DateTimePickerEvent, date?: Date) {
    if (event.type === "set" && date) {
      setDraftValue(date);
    }
  }

  function handleDone() {
    onChange(draftValue);
    onDone();
  }

  return (
    <PickerModal
      onClose={onCancel}
      onDone={handleDone}
      title={mode === "date" ? "Choose a date" : "Choose a start time"}
      visible
    >
      {mode === "date" ? (
        <DateTimePicker
          display="spinner"
          key="native-date-picker"
          maximumDate={maximumAppointmentDate}
          minimumDate={minimumAppointmentDate}
          mode="date"
          onChange={handleChange}
          style={styles.nativePicker}
          textColor={colors.primary}
          value={draftValue}
        />
      ) : (
        <TimeWheelPicker onChange={setDraftValue} value={draftValue} />
      )}
    </PickerModal>
  );
}

const hourOptions = Array.from({ length: 12 }, (_, index) => index + 1);
const minuteOptions = Array.from({ length: 60 }, (_, index) => index);

function TimeWheelPicker({
  onChange,
  value,
}: {
  onChange: (date: Date) => void;
  value: Date;
}) {
  const period = value.getHours() >= 12 ? "PM" : "AM";
  const hour = value.getHours() % 12 || 12;

  function updateTime(nextHour: number, nextMinute: number, nextPeriod: string) {
    const nextValue = new Date(value);
    const hour24 =
      nextPeriod === "PM" ? (nextHour % 12) + 12 : nextHour % 12;

    nextValue.setHours(hour24, nextMinute, 0, 0);
    onChange(nextValue);
  }

  return (
    <View style={styles.timeWheelRow}>
      <Picker
        onValueChange={(nextHour) =>
          updateTime(Number(nextHour), value.getMinutes(), period)
        }
        selectedValue={hour}
        style={styles.timeWheel}
      >
        {hourOptions.map((hourOption) => (
          <Picker.Item
            key={hourOption}
            label={String(hourOption)}
            value={hourOption}
          />
        ))}
      </Picker>

      <Picker
        onValueChange={(nextMinute) =>
          updateTime(hour, Number(nextMinute), period)
        }
        selectedValue={value.getMinutes()}
        style={styles.timeWheel}
      >
        {minuteOptions.map((minuteOption) => (
          <Picker.Item
            key={minuteOption}
            label={String(minuteOption).padStart(2, "0")}
            value={minuteOption}
          />
        ))}
      </Picker>

      <Picker
        onValueChange={(nextPeriod) =>
          updateTime(hour, value.getMinutes(), String(nextPeriod))
        }
        selectedValue={period}
        style={styles.timeWheel}
      >
        <Picker.Item label="AM" value="AM" />
        <Picker.Item label="PM" value="PM" />
      </Picker>
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
  nativePicker: {
    height: 216,
    width: "100%",
  },
  timeWheelRow: {
    flexDirection: "row",
    height: 216,
  },
  timeWheel: {
    color: colors.primary,
    flex: 1,
    fontFamily: fonts.body,
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
