import { DateTimePickerModal } from "@/components/common/DateTimePickerModal";
import { HapticButton } from "@/components/common/HapticButton";
import { PickerModal } from "@/components/common/PickerModal";
import { useCreateCareTask } from "@/hooks/useCreateCareTask";
import { useProviders } from "@/hooks/useProviders";
import { useUpdateCareTask } from "@/hooks/useUpdateCareTask";
import { useAuth } from "@/store/auth/AuthContext";
import { useToast } from "@/store/ToastContext";
import { buttonDisabled } from "@/theme/buttons";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import {
  field,
  fieldStack,
  label,
  submitButton,
  submitButtonText,
  textInput,
} from "@/theme/forms";
import type { CareTaskFormData } from "@/types/care-task-form";
import type { CareTask } from "@/types/care-task";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import type { ReactNode } from "react";
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

type ActivePicker = "date" | "time" | null;

const maximumTaskDate = new Date(2100, 11, 31);
const minimumTaskDate = new Date(1900, 0, 1);
const taskDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const taskTimeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

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

function createInitialFormData(date: Date): CareTaskFormData {
  return {
    title: "",
    notes: "",
    dueDate: formatDateForApi(date),
    dueTime: "",
    providerId: "",
  };
}

function createEditFormData(task: CareTask): CareTaskFormData {
  return {
    title: task.title,
    notes: task.notes ?? "",
    dueDate: task.dueDate,
    dueTime: task.dueTime ?? "",
    providerId: task.providerId ? String(task.providerId) : "",
  };
}

function parseDate(dateValue: string) {
  const [year, month, day] = dateValue.slice(0, 10).split("-").map(Number);

  return year && month && day ? new Date(year, month - 1, day) : new Date();
}

function parseTime(timeValue: string) {
  const [hours, minutes] = timeValue.split(":").map(Number);
  const date = new Date();

  if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
    date.setHours(hours, minutes, 0, 0);
  }

  return date;
}

function getStartOfToday() {
  const today = new Date();

  today.setHours(0, 0, 0, 0);
  return today;
}

export default function AddCareTaskForm({
  footer,
  onCreateSuccess,
  task,
}: {
  footer?: ReactNode;
  onCreateSuccess?: () => void;
  task?: CareTask;
}) {
  const [initialFormData] = useState(() =>
    task ? createEditFormData(task) : createInitialFormData(new Date()),
  );
  const [initialDate] = useState(() => parseDate(initialFormData.dueDate));
  const [initialTime] = useState(() =>
    initialFormData.dueTime ? parseTime(initialFormData.dueTime) : new Date(),
  );
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedTime, setSelectedTime] = useState(initialTime);
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [showProviderPicker, setShowProviderPicker] = useState(false);
  const [draftProviderId, setDraftProviderId] = useState("");
  const { token } = useAuth();
  const { providers, isLoading: providersLoading } = useProviders();
  const createTaskMutation = useCreateCareTask();
  const updateTaskMutation = useUpdateCareTask();
  const { showToast } = useToast();
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting, isValid },
  } = useForm<CareTaskFormData>({
    defaultValues: initialFormData,
    mode: "onChange",
  });

  useFocusEffect(
    useCallback(() => {
      return () => {
        const nextDate = task ? initialDate : new Date();
        const nextTime = task ? initialTime : nextDate;

        setSelectedDate(nextDate);
        setSelectedTime(nextTime);
        setActivePicker(null);
        setShowProviderPicker(false);
        setDraftProviderId("");
        reset(task ? initialFormData : createInitialFormData(nextDate));
      };
    }, [initialDate, initialFormData, initialTime, reset, task]),
  );

  function updateDate(date: Date) {
    setSelectedDate(date);
    setValue("dueDate", formatDateForApi(date), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  function updateTime(date: Date) {
    setSelectedTime(date);
    setValue("dueTime", formatTimeForApi(date), {
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
              minimumDate: task ? minimumTaskDate : getStartOfToday(),
              maximumDate: maximumTaskDate,
            }
          : {}),
        onChange: (event, date) => {
          if (event.type !== "set" || !date) {
            return;
          }

          if (mode === "date") {
            updateDate(date);
          } else {
            updateTime(date);
          }
        },
      });
      return;
    }

    setActivePicker(mode);
  }

  async function onSubmit(formData: CareTaskFormData) {
    if (!token) {
      return;
    }

    try {
      const reminderData = {
        title: formData.title.trim(),
        notes: formData.notes.trim() || undefined,
        dueDate: formData.dueDate,
        dueTime: formData.dueTime || undefined,
        providerId: formData.providerId
          ? Number(formData.providerId)
          : undefined,
      };

      if (task) {
        await updateTaskMutation.mutateAsync([
          {
            ...reminderData,
            taskId: task.id,
            status: task.status,
          },
          token,
        ]);
      } else {
        await createTaskMutation.mutateAsync([reminderData, token]);
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(
        task
          ? "Health reminder updated successfully"
          : "Health reminder added successfully",
        "success",
      );
      if (task) {
        router.dismissTo("/reminders");
      } else if (onCreateSuccess) {
        onCreateSuccess();
      } else {
        router.navigate("/reminders");
      }
    } catch (error) {
      console.log(error);
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
      <ControlledFloatingInput
        control={control}
        labelText="Reminder Title"
        name="title"
        placeholder="Schedule MRI"
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

      <View style={styles.dateTimeRow}>
        <Controller
          control={control}
          name="dueDate"
          rules={{
            required: "Due date is required.",
            pattern: {
              value: taskDateRegex,
              message: "Choose a valid due date.",
            },
          }}
          render={({ fieldState }) => (
            <PickerTrigger
              displayValue={formatDateForDisplay(selectedDate)}
              errorMessage={
                fieldState.isTouched ? fieldState.error?.message : undefined
              }
              isActive={activePicker === "date"}
              labelText="Due Date"
              onPress={() => openPicker("date")}
              required
            />
          )}
        />

        <Controller
          control={control}
          name="dueTime"
          rules={{
            validate: (value) =>
              !value || taskTimeRegex.test(value) || "Choose a valid time.",
          }}
          render={({ field: timeField, fieldState }) => (
            <PickerTrigger
              displayValue={
                timeField.value
                  ? formatTimeForDisplay(selectedTime)
                  : "Add a time"
              }
              errorMessage={
                fieldState.isTouched ? fieldState.error?.message : undefined
              }
              isActive={activePicker === "time"}
              labelText="Due Time"
              onClear={
                timeField.value
                  ? () => {
                      timeField.onChange("");
                      setActivePicker(null);
                    }
                  : undefined
              }
              onPress={() => openPicker("time")}
            />
          )}
        />
      </View>

      {activePicker ? (
        <DateTimePickerModal
          maximumDate={
            activePicker === "date" ? maximumTaskDate : undefined
          }
          minimumDate={
            activePicker === "date"
              ? task
                ? minimumTaskDate
                : getStartOfToday()
              : undefined
          }
          mode={activePicker}
          onClose={() => setActivePicker(null)}
          onDone={(value) => {
            if (activePicker === "date") {
              updateDate(value);
            } else {
              updateTime(value);
            }

            setActivePicker(null);
          }}
          title={
            activePicker === "date" ? "Choose a due date" : "Choose a due time"
          }
          value={activePicker === "date" ? selectedDate : selectedTime}
          visible
        />
      ) : null}

      <Controller
        control={control}
        name="providerId"
        render={({ field: providerField }) => {
          const provider = providers.find(
            (option) => String(option.id) === providerField.value,
          );
          const providerName = provider
            ? provider.type === "clinic"
              ? (provider.clinicName ?? "Clinic")
              : [provider.firstName, provider.lastName]
                  .filter(Boolean)
                  .join(" ")
            : "No provider linked";

          return (
            <>
              <View style={[field, fieldStack]}>
                <Text style={label}>Provider or Clinic</Text>
                <HapticButton
                  disabled={providersLoading}
                  onPress={() => {
                    setDraftProviderId(providerField.value);
                    setShowProviderPicker(true);
                  }}
                  style={styles.pickerTrigger}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.pickerTriggerText,
                      provider ? null : styles.pickerPlaceholder,
                    ]}
                  >
                    {providersLoading ? "Loading care team..." : providerName}
                  </Text>
                </HapticButton>
              </View>

              <PickerModal
                onClose={() => setShowProviderPicker(false)}
                onDone={() => {
                  providerField.onChange(draftProviderId);
                  providerField.onBlur();
                  setShowProviderPicker(false);
                }}
                title="Link a provider or clinic"
                visible={showProviderPicker}
              >
                <Picker
                  onValueChange={(providerId) =>
                    setDraftProviderId(String(providerId))
                  }
                  selectedValue={draftProviderId}
                  style={styles.providerPicker}
                >
                  <Picker.Item label="No provider linked" value="" />
                  {providers.map((option) => {
                    const displayName =
                      option.type === "clinic"
                        ? (option.clinicName ?? "Clinic")
                        : [option.firstName, option.lastName]
                            .filter(Boolean)
                            .join(" ");

                    return (
                      <Picker.Item
                        key={option.id}
                        label={displayName}
                        value={String(option.id)}
                      />
                    );
                  })}
                </Picker>
              </PickerModal>
            </>
          );
        }}
      />

      <ControlledFloatingInput
        control={control}
        labelText="Notes"
        multiline
        name="notes"
        placeholder="Add any details you want to remember"
        rules={{
          maxLength: {
            value: 2000,
            message: "Notes cannot exceed 2,000 characters.",
          },
        }}
      />

      <HapticButton
        disabled={!isValid || isSubmitting}
        onPress={handleSubmit(onSubmit)}
        style={[
          submitButton,
          !isValid || isSubmitting ? buttonDisabled : null,
        ]}
      >
        <Text style={submitButtonText}>
          {isSubmitting
            ? task
              ? "Saving Reminder..."
              : "Adding Reminder..."
            : task
              ? "Save Reminder"
              : "Add Health Reminder"}
        </Text>
      </HapticButton>

      {footer}
    </ScrollView>
  );
}

type ControlledFloatingInputProps = {
  control: Control<CareTaskFormData>;
  labelText: string;
  multiline?: boolean;
  name: keyof CareTaskFormData;
  placeholder?: string;
  required?: boolean;
  rules?: ControllerProps<CareTaskFormData>["rules"];
};

function ControlledFloatingInput({
  control,
  labelText,
  multiline = false,
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
            multiline={multiline}
            numberOfLines={multiline ? 4 : 1}
            onBlur={inputField.onBlur}
            onChangeText={inputField.onChange}
            placeholder={placeholder}
            placeholderTextColor="#8a96a8"
            ref={inputField.ref}
            style={[
              textInput,
              multiline ? styles.notesInput : null,
              fieldState.isTouched && fieldState.invalid
                ? styles.inputError
                : null,
            ]}
            textAlignVertical={multiline ? "top" : "center"}
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

function PickerTrigger({
  displayValue,
  errorMessage,
  isActive,
  labelText,
  onPress,
  onClear,
  required = false,
}: {
  displayValue: string;
  errorMessage?: string;
  isActive: boolean;
  labelText: string;
  onClear?: () => void;
  onPress: () => void;
  required?: boolean;
}) {
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
        <Text numberOfLines={1} style={styles.pickerTriggerText}>
          {displayValue}
        </Text>
      </HapticButton>
      {onClear ? (
        <HapticButton onPress={onClear} style={styles.clearTimeButton}>
          <Text style={styles.clearTimeText}>Remove time</Text>
        </HapticButton>
      ) : null}
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 18,
    paddingBottom: 112,
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
    fontSize: 14,
    fontWeight: fontWeights.semibold,
  },
  pickerPlaceholder: {
    color: "#8a96a8",
  },
  providerPicker: {
    color: colors.primary,
    fontFamily: fonts.body,
    height: Platform.select({ ios: 216, default: 56 }),
    width: "100%",
  },
  clearTimeButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  clearTimeText: {
    color: "#7b8798",
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: fontWeights.semibold,
  },
  notesInput: {
    minHeight: 112,
    paddingTop: 18,
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
