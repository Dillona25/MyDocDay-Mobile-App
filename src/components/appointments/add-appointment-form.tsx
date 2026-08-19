import { PickerModal } from "@/components/common/PickerModal";
import { CarePersonSelector } from "@/components/family/care-person-selector";
import { appointmentTypes } from "@/data/appointmentTypes";
import { useCreateAppointment } from "@/hooks/useCreateAppointment";
import { useCareMembers } from "@/hooks/useCareMembers";
import { useProviders } from "@/hooks/useProviders";
import { useAuth } from "@/store/auth/AuthContext";
import { useToast } from "@/store/ToastContext";
import { buttonDisabled } from "@/theme/buttons";
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
import type { AppointmentFormData } from "@/types/appointment-form";
import type { Provider } from "@/types/provider";
import { formatProviderLocation } from "@/api/providers/provider-location";
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import {
  Controller,
  type Control,
  type ControllerProps,
  useForm,
} from "react-hook-form";
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
const appointmentDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const appointmentTimeRegex = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

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
    careMemberId: "self",
    title: "",
    date: formatDateForApi(date),
    startTime: formatTimeForApi(date),
    appointmentType: "",
    providerSelection: "",
    providerId: "",
    doctorName: "",
    location: "",
    providerVisitWindowResponse: "",
    providerVisitWindowDate: null,
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
  onCreateSuccess?: () => void;
  onEditSubmit?: (formData: AppointmentFormData) => void | Promise<void>;
};

export default function AddAppointmentForm({
  footer,
  initialData,
  mode = "create",
  onCreateSuccess,
  onEditSubmit,
}: AddAppointmentFormProps) {
  const [defaultInitialData] = useState(() =>
    createInitialAppointmentFormData(new Date()),
  );
  const resolvedInitialData = initialData ?? defaultInitialData;
  const { error, isLoading, providers } = useProviders();
  const {
    careMembers,
    error: careMembersError,
    isLoading: careMembersLoading,
  } = useCareMembers();
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
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    trigger,
    watch,
    formState: { isSubmitting, isValid },
  } = useForm<AppointmentFormData>({
    defaultValues: resolvedInitialData,
    mode: "onChange",
  });
  const selectedProviderMode = watch("providerSelection");
  const selectedCareMemberId = watch("careMemberId");
  const selectedProviderId = watch("providerId");
  const selectedAppointmentType = watch("appointmentType");
  const selectedAppointmentDate = watch("date");
  const providerVisitWindowDate = watch("providerVisitWindowDate");
  const availableProviders = providers.filter((provider) =>
    selectedCareMemberId === "self"
      ? provider.isForAccountOwner
      : provider.careMembers.some(
          (member) => String(member.id) === selectedCareMemberId,
        ),
  );
  const selectedProvider = availableProviders.find(
    (provider) => String(provider.id) === selectedProviderId,
  );
  const savedProviderAddress = selectedProvider
    ? formatProviderLocation(selectedProvider)
    : null;
  const adjacentVisitWindowDate = getAdjacentVisitWindowDate(
    selectedProviderMode === "saved" ? selectedProvider : undefined,
    selectedAppointmentDate,
    resolvedInitialData.providerId === selectedProviderId
      ? resolvedInitialData.providerVisitWindowDate
      : null,
    selectedCareMemberId,
  );

  useEffect(() => {
    void trigger(["providerId", "doctorName"]);
  }, [selectedProviderMode, trigger]);

  useEffect(() => {
    if (providerVisitWindowDate === adjacentVisitWindowDate) {
      void trigger("providerVisitWindowResponse");
      return;
    }

    setValue("providerVisitWindowDate", adjacentVisitWindowDate, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("providerVisitWindowResponse", "", {
      shouldDirty: true,
      shouldValidate: true,
    });
    void trigger("providerVisitWindowResponse");
  }, [
    adjacentVisitWindowDate,
    providerVisitWindowDate,
    setValue,
    trigger,
  ]);

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
        reset(
          mode === "edit"
            ? resolvedInitialData
            : createInitialAppointmentFormData(nextDate),
        );
      };
    }, [mode, reset, resolvedInitialData]),
  );

  function updateSelectedDate(date: Date) {
    setSelectedDate(date);
    setValue("date", formatDateForApi(date), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  function updateSelectedTime(date: Date) {
    setSelectedTime(date);
    setValue("startTime", formatTimeForApi(date), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
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
    const normalizedFormData = normalizeAppointmentFormData(formData);
    const resolvedLocation =
      normalizedFormData.appointmentType === "in_person"
        ? normalizedFormData.location || savedProviderAddress || undefined
        : undefined;

    if (mode === "edit") {
      await onEditSubmit?.({
        ...normalizedFormData,
        location: resolvedLocation ?? "",
      });
      return;
    }

    if (!token) {
      return;
    }

    try {
      await createAppointmentMutation.mutateAsync([
        {
          careMemberId:
            normalizedFormData.careMemberId === "self"
              ? undefined
              : Number(normalizedFormData.careMemberId),
          title: normalizedFormData.title,
          date: normalizedFormData.date,
          startTime: normalizedFormData.startTime,
          appointmentType:
            normalizedFormData.appointmentType || "in_person",
          providerId:
            normalizedFormData.providerSelection === "saved" &&
            normalizedFormData.providerId
              ? Number(normalizedFormData.providerId)
              : undefined,
          doctorName:
            normalizedFormData.providerSelection === otherDoctorValue
              ? normalizedFormData.doctorName
              : undefined,
          location: resolvedLocation,
          providerVisitWindowDate:
            normalizedFormData.providerVisitWindowResponse === "covers"
              ? normalizedFormData.providerVisitWindowDate
              : null,
        },
        token,
      ]);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Appointment added successfully", "success");
      const nextDate = new Date();

      setSelectedDate(nextDate);
      setSelectedTime(nextDate);
      setActivePicker(null);
      reset(createInitialAppointmentFormData(nextDate));
      onCreateSuccess?.();
    } catch (requestError) {
      console.log(requestError);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast("Something went wrong with the request", "error");
    }
  }

  return (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={styles.form}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Controller
        control={control}
        name="careMemberId"
        rules={{ required: "Choose who this appointment is for." }}
        render={({ field: personField, fieldState }) => (
          <CarePersonSelector
            careMembers={careMembers}
            errorMessage={
              fieldState.error?.message || careMembersError || undefined
            }
            isLoading={careMembersLoading}
            onChange={({ isForAccountOwner, careMemberIds }) => {
              personField.onChange(
                isForAccountOwner ? "self" : String(careMemberIds[0]),
              );
              personField.onBlur();
              setValue("providerId", "", {
                shouldDirty: true,
                shouldValidate: true,
              });
              setValue("providerVisitWindowResponse", "", {
                shouldDirty: true,
                shouldValidate: true,
              });
              setValue("providerVisitWindowDate", null, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            selectedCareMemberIds={
              personField.value === "self" ? [] : [Number(personField.value)]
            }
            selectedForAccountOwner={personField.value === "self"}
          />
        )}
      />

      <ControlledFloatingInput
        control={control}
        labelText="Appointment Title"
        name="title"
        required
        rules={{
          maxLength: {
            value: 150,
            message: "Title cannot exceed 150 characters.",
          },
          validate: (value) =>
            value.trim().length >= 2 || "Enter at least 2 characters.",
        }}
      />

      <View style={styles.dateTimeGroup}>
        <View style={styles.dateTimeRow}>
          <Controller
            control={control}
            name="date"
            rules={{
              required: "Date is required.",
              validate: (value) =>
                isValidAppointmentDate(value) || "Choose a valid date.",
            }}
            render={({ fieldState }) => (
              <DateTimeTrigger
                displayValue={formatDateForDisplay(selectedDate)}
                errorMessage={
                  fieldState.isTouched ? fieldState.error?.message : undefined
                }
                isActive={activePicker === "date"}
                labelText="Date"
                onPress={() => openPicker("date")}
                required
              />
            )}
          />
          <Controller
            control={control}
            name="startTime"
            rules={{
              required: "Start time is required.",
              pattern: {
                value: appointmentTimeRegex,
                message: "Choose a valid start time.",
              },
            }}
            render={({ fieldState }) => (
              <DateTimeTrigger
                displayValue={formatTimeForDisplay(selectedTime)}
                errorMessage={
                  fieldState.isTouched ? fieldState.error?.message : undefined
                }
                isActive={activePicker === "time"}
                labelText="Start Time"
                onPress={() => openPicker("time")}
                required
              />
            )}
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

      <Controller
        control={control}
        name="appointmentType"
        rules={{ required: "Choose an appointment type." }}
        render={({ field: typeField, fieldState }) => (
          <View style={styles.fieldGroup}>
            <RequiredLabel>Appointment Type</RequiredLabel>
            <View style={segmentedRow}>
              {appointmentTypes.map((typeOption) => {
                const isActive = selectedAppointmentType === typeOption.value;

                return (
                  <HapticButton
                    key={typeOption.value}
                    onPress={() => typeField.onChange(typeOption.value)}
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
            {fieldState.isTouched && fieldState.error ? (
              <Text style={styles.errorText}>{fieldState.error.message}</Text>
            ) : null}
          </View>
        )}
      />

      <Controller
        control={control}
        name="providerSelection"
        rules={{ required: "Choose how to add the provider." }}
        render={({ field: selectionField, fieldState }) => (
          <View style={styles.fieldGroup}>
            <RequiredLabel>Which Provider or Clinic?</RequiredLabel>
            <View style={segmentedRow}>
              {providerOptions.map((providerOption) => {
                const isActive =
                  selectedProviderMode === providerOption.value;

                return (
                  <HapticButton
                    key={providerOption.value}
                    onPress={() => {
                      selectionField.onChange(providerOption.value);
                      setValue("providerId", "", {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setValue("doctorName", "", {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setValue("providerVisitWindowResponse", "", {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setValue("providerVisitWindowDate", null, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
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
            {fieldState.isTouched && fieldState.error ? (
              <Text style={styles.errorText}>{fieldState.error.message}</Text>
            ) : null}
          </View>
        )}
      />

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
          <Controller
            control={control}
            name="providerId"
            rules={{
              validate: (value) =>
                selectedProviderMode !== "saved" ||
                (Number.isInteger(Number(value)) && Number(value) > 0) ||
                "Choose a saved provider.",
            }}
            render={({ field: providerField, fieldState }) => (
              <>
                {availableProviders.map((provider) => {
                  const providerId = String(provider.id);
                  const isActive = selectedProviderId === providerId;
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
                      onPress={() => {
                        if (selectedProviderId !== providerId) {
                          setValue("providerVisitWindowResponse", "", {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          setValue("providerVisitWindowDate", null, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }
                        providerField.onChange(providerId);
                        providerField.onBlur();
                      }}
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
                          {provider.specialty
                            ? ` - ${provider.specialty}`
                            : ""}
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
                {fieldState.isTouched && fieldState.error ? (
                  <Text style={styles.errorText}>
                    {fieldState.error.message}
                  </Text>
                ) : null}
              </>
            )}
          />
        </View>
      ) : null}

      {adjacentVisitWindowDate ? (
        <Controller
          control={control}
          name="providerVisitWindowResponse"
          rules={{
            validate: (value) =>
              !adjacentVisitWindowDate ||
              value === "covers" ||
              value === "separate" ||
              "Choose whether this appointment covers the routine visit.",
          }}
          render={({ field: responseField, fieldState }) => (
            <View style={styles.visitWindowQuestion}>
              <RequiredLabel>
                Does this appointment count as your needed{
                  " "
                }{formatVisitWindowMonth(adjacentVisitWindowDate)} routine visit?
              </RequiredLabel>
              <View style={segmentedRow}>
                {[
                  { label: "Yes, it does", value: "covers" },
                  { label: "No, it is separate", value: "separate" },
                ].map((option) => {
                  const isActive = responseField.value === option.value;

                  return (
                    <HapticButton
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      key={option.value}
                      onPress={() => {
                        responseField.onChange(option.value);
                        responseField.onBlur();
                      }}
                      style={[
                        optionButton,
                        isActive ? optionButtonActive : null,
                      ]}
                    >
                      <Text
                        style={[
                          optionButtonText,
                          isActive ? optionButtonTextActive : null,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </HapticButton>
                  );
                })}
              </View>
              {fieldState.isTouched && fieldState.error ? (
                <Text style={styles.errorText}>{fieldState.error.message}</Text>
              ) : null}
            </View>
          )}
        />
      ) : null}

      {selectedProviderMode === otherDoctorValue ? (
        <ControlledFloatingInput
          control={control}
          labelText="Provider or Clinic Name"
          name="doctorName"
          required
          rules={{
            maxLength: {
              value: 200,
              message: "Name cannot exceed 200 characters.",
            },
            validate: (value) =>
              selectedProviderMode !== otherDoctorValue ||
              value.trim().length > 0 ||
              "Provider or clinic name is required.",
          }}
        />
      ) : null}

      {selectedAppointmentType === "in_person" ? (
        <View style={styles.locationGroup}>
          <ControlledFloatingInput
            control={control}
            labelText="Location"
            name="location"
            placeholder="Clinic, hospital, or address"
            rules={{
              maxLength: {
                value: 500,
                message: "Location cannot exceed 500 characters.",
              },
            }}
          />
          {savedProviderAddress ? (
            <Text style={styles.locationHelper}>
              Leave this blank to use: {savedProviderAddress}
            </Text>
          ) : null}
        </View>
      ) : null}

      <HapticButton
        disabled={!isValid || isSubmitting}
        onPress={handleSubmit(onSubmitPress)}
        style={[
          submitButton,
          !isValid || isSubmitting ? buttonDisabled : null,
        ]}
      >
        <Text style={submitButtonText}>
          {isSubmitting
            ? mode === "edit"
              ? "Saving Changes..."
              : "Adding Appointment..."
            : mode === "edit"
              ? "Save Changes"
              : "Add Appointment"}
        </Text>
      </HapticButton>

      {footer}
    </ScrollView>
  );
}

type AppointmentTextFieldName = "title" | "doctorName" | "location";

type ControlledFloatingInputProps = {
  control: Control<AppointmentFormData>;
  labelText: string;
  name: AppointmentTextFieldName;
  placeholder?: string;
  required?: boolean;
  rules?: ControllerProps<
    AppointmentFormData,
    AppointmentTextFieldName
  >["rules"];
};

function ControlledFloatingInput({
  control,
  labelText,
  name,
  placeholder,
  required = false,
  rules,
}: ControlledFloatingInputProps) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: inputField, fieldState }) => (
        <View style={[field, fieldStack]}>
          <Text style={label}>
            {labelText}
            {required ? <Text style={styles.requiredIndicator}> *</Text> : null}
          </Text>
          <TextInput
            onBlur={inputField.onBlur}
            onChangeText={inputField.onChange}
            placeholder={placeholder}
            placeholderTextColor="#8a96a8"
            ref={inputField.ref}
            style={[
              textInput,
              fieldState.isTouched && fieldState.invalid
                ? styles.inputError
                : null,
            ]}
            value={inputField.value}
          />
          {fieldState.isTouched && fieldState.error ? (
            <Text style={styles.errorText}>{fieldState.error.message}</Text>
          ) : null}
        </View>
      )}
    />
  );
}

type DateTimeTriggerProps = {
  labelText: string;
  displayValue: string;
  errorMessage?: string;
  isActive: boolean;
  onPress: () => void;
  required?: boolean;
};

function DateTimeTrigger({
  displayValue,
  errorMessage,
  isActive,
  labelText,
  onPress,
  required = false,
}: DateTimeTriggerProps) {
  return (
    <View style={[field, fieldStack]}>
      <Text style={label}>
        {labelText}
        {required ? <Text style={styles.requiredIndicator}> *</Text> : null}
      </Text>
      <HapticButton
        onPress={onPress}
        style={[
          styles.pickerTrigger,
          isActive ? styles.pickerTriggerActive : null,
          errorMessage ? styles.inputError : null,
        ]}
      >
        <Text style={styles.pickerTriggerText}>{displayValue}</Text>
      </HapticButton>
      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}
    </View>
  );
}

function RequiredLabel({ children }: { children: ReactNode }) {
  return (
    <Text style={styles.groupLabel}>
      {children}
      <Text style={styles.requiredIndicator}> *</Text>
    </Text>
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

function isValidAppointmentDate(value: string) {
  if (!appointmentDateRegex.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function normalizeAppointmentFormData(
  formData: AppointmentFormData,
): AppointmentFormData {
  const usesSavedProvider = formData.providerSelection === "saved";

  return {
    careMemberId: formData.careMemberId,
    title: formData.title.trim(),
    date: formData.date.slice(0, 10),
    startTime: formData.startTime.slice(0, 5),
    appointmentType: formData.appointmentType,
    providerSelection: formData.providerSelection,
    providerId: usesSavedProvider ? formData.providerId : "",
    doctorName: usesSavedProvider ? "" : formData.doctorName.trim(),
    location:
      formData.appointmentType === "in_person"
        ? formData.location.trim()
        : "",
    providerVisitWindowResponse: formData.providerVisitWindowResponse,
    providerVisitWindowDate: formData.providerVisitWindowDate,
  };
}

function getAdjacentVisitWindowDate(
  provider: Provider | undefined,
  appointmentDate: string,
  existingWindowDate: string | null | undefined,
  careMemberId: string,
): string | null {
  if (appointmentDate.slice(0, 10) < formatDateForApi(new Date())) return null;

  const selectedSchedule = provider?.visitSchedules.find(
    (schedule) =>
      schedule.careMemberId ===
        (careMemberId === "self" ? null : Number(careMemberId)) &&
      schedule.isEnabled,
  );

  if (!selectedSchedule) return null;

  if (
    existingWindowDate &&
    areAdjacentCalendarMonths(appointmentDate, existingWindowDate)
  ) {
    return existingWindowDate;
  }

  if (
    selectedSchedule.nextVisitDueDate &&
    areAdjacentCalendarMonths(appointmentDate, selectedSchedule.nextVisitDueDate)
  ) {
    return selectedSchedule.nextVisitDueDate;
  }

  const [appointmentYear] = appointmentDate.slice(0, 7).split("-").map(Number);
  const adjacentWindows = selectedSchedule.annualMonths.flatMap((month) =>
    [appointmentYear - 1, appointmentYear, appointmentYear + 1]
      .map((year) => `${year}-${String(month).padStart(2, "0")}-15`)
      .filter((date) => areAdjacentCalendarMonths(appointmentDate, date)),
  );

  return adjacentWindows.length === 1 ? adjacentWindows[0] : null;
}

function areAdjacentCalendarMonths(left: string, right: string): boolean {
  const [leftYear, leftMonth] = left.slice(0, 7).split("-").map(Number);
  const [rightYear, rightMonth] = right.slice(0, 7).split("-").map(Number);

  if (!leftYear || !leftMonth || !rightYear || !rightMonth) return false;

  return Math.abs(leftYear * 12 + leftMonth - (rightYear * 12 + rightMonth)) === 1;
}

function formatVisitWindowMonth(date: string): string {
  const [year, month] = date.slice(0, 7).split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

const styles = StyleSheet.create({
  form: {
    gap: 18,
    paddingBottom: 112,
  },
  fieldGroup: {
    gap: 10,
  },
  locationGroup: {
    gap: 6,
  },
  locationHelper: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
  },
  visitWindowQuestion: {
    backgroundColor: "#edf9f8",
    borderColor: "rgba(28, 184, 178, 0.28)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 14,
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
  requiredIndicator: {
    color: "#d24747",
  },
  inputError: {
    borderColor: "#d24747",
  },
  errorText: {
    color: "#d24747",
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
  },
});
