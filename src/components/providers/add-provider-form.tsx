import { HapticButton } from "@/components/common/HapticButton";
import { PickerModal } from "@/components/common/PickerModal";
import { CarePersonSelector } from "@/components/family/care-person-selector";
import { providerTypes } from "@/data/providerTypes";
import { usStates } from "@/data/usStates";
import { useCreateProvider } from "@/hooks/useCreateProvider";
import { useCareMembers } from "@/hooks/useCareMembers";
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
import type { ProviderFormData } from "@/types/provider-form";
import type { CreateProviderInput } from "@/types/provider";
import { Picker } from "@react-native-picker/picker";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import {
  Controller,
  type Control,
  type ControllerProps,
  type UseFormSetValue,
  useForm,
} from "react-hook-form";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

const phoneNumberRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
const zipCodeRegex = /^\d{5}$/;
const visitMonths = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
const appointmentStatuses = [
  { label: "Yes, it is already booked", value: "scheduled" },
  { label: "No, remind me before that month", value: "not_scheduled" },
  { label: "I am not sure", value: "unsure" },
] as const;
const reminderLeadTimes = [
  { label: "On the due date", value: 0 },
  { label: "1 week before", value: 7 },
  { label: "2 weeks before", value: 14 },
  { label: "1 month before", value: 30 },
] as const;
const secondReminderDefaults = [7, 14, 30, 0] as const;

export const initialProviderFormData: ProviderFormData = {
  isForAccountOwner: true,
  careMemberIds: [],
  firstName: "",
  lastName: "",
  clinicName: "",
  specialty: "",
  phoneNumber: "",
  type: "",
  imageUrl: "",
  streetAddress: "",
  city: "",
  state: "",
  zipCode: "",
  scheduleAnswer: "",
  annualMonths: [],
  nextAppointmentStatus: "",
  reminderLeadDays: 30,
  secondReminderLeadDays: null,
};

type AddProviderFormProps = {
  footer?: ReactNode;
  initialData?: ProviderFormData;
  mode?: "create" | "edit";
  onCreateSuccess?: () => void;
  onEditSubmit?: (providerData: CreateProviderInput) => void | Promise<void>;
};

export default function AddProviderForm({
  footer,
  initialData = initialProviderFormData,
  mode = "create",
  onCreateSuccess,
  onEditSubmit,
}: AddProviderFormProps) {
  const formDefaults = getProviderFormDefaults(initialData);
  const { token } = useAuth();
  const {
    careMembers,
    error: careMembersError,
    isLoading: careMembersLoading,
  } = useCareMembers();
  const createProviderMutation = useCreateProvider();
  const { showToast } = useToast();
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [draftState, setDraftState] = useState(formDefaults.state);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    trigger,
    watch,
    formState: { isSubmitting, isValid },
  } = useForm<ProviderFormData>({
    defaultValues: formDefaults,
    mode: "onChange",
  });
  const providerType = watch("type");
  const isForAccountOwner = watch("isForAccountOwner");
  const scheduleAnswer = watch("scheduleAnswer");
  const nextAppointmentStatus = watch("nextAppointmentStatus");
  const reminderLeadDays = watch("reminderLeadDays");
  const secondReminderLeadDays = watch("secondReminderLeadDays");

  useEffect(() => {
    void trigger(["firstName", "lastName", "clinicName", "specialty"]);
  }, [providerType, trigger]);

  useEffect(() => {
    void trigger(["scheduleAnswer", "annualMonths", "nextAppointmentStatus"]);
  }, [nextAppointmentStatus, scheduleAnswer, trigger]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        const resetValues = getProviderFormDefaults(initialData);

        reset(resetValues);
        setDraftState(resetValues.state);
        setShowStatePicker(false);
      };
    }, [initialData, reset]),
  );

  async function onSubmitPress(formData: ProviderFormData) {
    const providerData = buildProviderPayload(formData, mode);

    if (mode === "edit") {
      await onEditSubmit?.(providerData);
      return;
    }

    if (!token) {
      return;
    }

    try {
      await createProviderMutation.mutateAsync([
        providerData,
        token,
      ]);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Provider added successfully", "success");
      reset(initialProviderFormData);
      setDraftState("");
      onCreateSuccess?.();
    } catch (error) {
      console.log(error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(
        error instanceof Error ? error.message : "Unable to add provider.",
        "error",
      );
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
        name="careMemberIds"
        rules={{
          validate: (ids) =>
            isForAccountOwner || ids.length > 0 || "Choose at least one person.",
        }}
        render={({ field: membersField, fieldState }) => (
          <CarePersonSelector
            careMembers={careMembers}
            errorMessage={
              fieldState.error?.message || careMembersError || undefined
            }
            isLoading={careMembersLoading}
            multiple
            onChange={({
              isForAccountOwner: nextIsForAccountOwner,
              careMemberIds: nextCareMemberIds,
            }) => {
              setValue("isForAccountOwner", nextIsForAccountOwner, {
                shouldDirty: true,
                shouldValidate: true,
              });
              membersField.onChange(nextCareMemberIds);
              membersField.onBlur();
            }}
            selectedCareMemberIds={membersField.value}
            selectedForAccountOwner={isForAccountOwner}
          />
        )}
      />

      <Controller
        control={control}
        name="type"
        rules={{ required: "Choose provider or clinic." }}
        render={({ field: typeField, fieldState }) => (
          <View style={styles.fieldGroup}>
            <RequiredLabel style={styles.groupLabel}>
              Is this a provider or clinic?
            </RequiredLabel>
            <View style={segmentedRow}>
              {providerTypes.map((typeOption) => {
                const isActive = providerType === typeOption.value;

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

      {providerType === "provider" ? (
        <View style={styles.fieldsRow}>
          <ControlledFloatingInput
            control={control}
            labelText="First Name"
            name="firstName"
            required
            rules={{
              maxLength: {
                value: 100,
                message: "First name cannot exceed 100 characters.",
              },
              validate: (value) =>
                providerType !== "provider" ||
                value.trim().length >= 2 ||
                "Enter at least 2 characters.",
            }}
          />
          <ControlledFloatingInput
            control={control}
            labelText="Last Name"
            name="lastName"
            required
            rules={{
              maxLength: {
                value: 100,
                message: "Last name cannot exceed 100 characters.",
              },
              validate: (value) =>
                providerType !== "provider" ||
                value.trim().length >= 2 ||
                "Enter at least 2 characters.",
            }}
          />
        </View>
      ) : null}

      {providerType === "clinic" ? (
        <ControlledFloatingInput
          control={control}
          labelText="Clinic Name"
          name="clinicName"
          required
          rules={{
            maxLength: {
              value: 200,
              message: "Clinic name cannot exceed 200 characters.",
            },
            validate: (value) =>
              providerType !== "clinic" ||
              value.trim().length >= 2 ||
              "Enter at least 2 characters.",
          }}
        />
      ) : null}

      {providerType ? (
        <>
          <View style={styles.fieldsRow}>
            <ControlledFloatingInput
              control={control}
              labelText={
                providerType === "clinic" ? "Clinic Type" : "Provider Specialty"
              }
              name="specialty"
              required
              rules={{
                maxLength: {
                  value: 150,
                  message: "Specialty cannot exceed 150 characters.",
                },
                validate: (value) =>
                  value.trim().length >= 2 || "Enter at least 2 characters.",
              }}
            />
            <ControlledFloatingInput
              control={control}
              keyboardType="phone-pad"
              labelText="Phone Number"
              name="phoneNumber"
              placeholder="(555) 123-4567"
              rules={{
                validate: (value) =>
                  !value ||
                  phoneNumberRegex.test(value) ||
                  "Use format (555) 123-4567.",
              }}
              transformValue={formatPhoneNumber}
            />
          </View>

          <ControlledFloatingInput
            autoCapitalize="none"
            control={control}
            labelText={
              providerType === "clinic"
                ? "Clinic Image URL"
                : "Provider Image URL"
            }
            name="imageUrl"
            placeholder="https://example.com/image.jpg"
            rules={{
              validate: (value) =>
                isValidImageUrl(value) || "Enter a valid image URL.",
            }}
          />

          {providerType === "clinic" ? (
            <>
              <ControlledFloatingInput
                control={control}
                labelText="Street Address"
                name="streetAddress"
                rules={{
                  maxLength: {
                    value: 255,
                    message: "Address cannot exceed 255 characters.",
                  },
                }}
              />

              <View style={styles.fieldsRow}>
                <ControlledFloatingInput
                  control={control}
                  labelText="City"
                  name="city"
                  rules={{
                    maxLength: {
                      value: 100,
                      message: "City cannot exceed 100 characters.",
                    },
                  }}
                />
                <Controller
                  control={control}
                  name="state"
                  rules={{
                    maxLength: {
                      value: 100,
                      message: "State cannot exceed 100 characters.",
                    },
                  }}
                  render={({ field: stateField }) => (
                    <>
                      <StatePickerTrigger
                        onPress={() => {
                          setDraftState(stateField.value);
                          setShowStatePicker(true);
                        }}
                        value={stateField.value}
                      />
                      <PickerModal
                        onClose={() => setShowStatePicker(false)}
                        onDone={() => {
                          stateField.onChange(draftState);
                          stateField.onBlur();
                          setShowStatePicker(false);
                        }}
                        title="Choose a state"
                        visible={showStatePicker}
                      >
                        <Picker
                          onValueChange={(stateName) =>
                            setDraftState(String(stateName))
                          }
                          selectedValue={draftState}
                          style={styles.statePicker}
                        >
                          <Picker.Item label="Choose a state" value="" />
                          {usStates.map((stateOption) => (
                            <Picker.Item
                              key={stateOption.abbreviation}
                              label={stateOption.name}
                              value={stateOption.name}
                            />
                          ))}
                        </Picker>
                      </PickerModal>
                    </>
                  )}
                />
              </View>

              <View style={styles.halfWidth}>
                <ControlledFloatingInput
                  control={control}
                  keyboardType="number-pad"
                  labelText="ZIP Code"
                  name="zipCode"
                  placeholder="97201"
                  rules={{
                    validate: (value) =>
                      !value ||
                      zipCodeRegex.test(value) ||
                      "Enter a 5-digit ZIP code.",
                  }}
                  transformValue={(value) =>
                    value.replace(/\D/g, "").slice(0, 5)
                  }
                />
              </View>
            </>
          ) : null}

          <VisitScheduleFields
            control={control}
            nextAppointmentStatus={nextAppointmentStatus}
            providerType={providerType}
            reminderLeadDays={reminderLeadDays}
            scheduleAnswer={scheduleAnswer}
            secondReminderLeadDays={secondReminderLeadDays}
            setValue={setValue}
          />

          <HapticButton
            disabled={!isValid || isSubmitting}
            style={[
              submitButton,
              !isValid || isSubmitting ? buttonDisabled : null,
            ]}
            onPress={handleSubmit(onSubmitPress)}
          >
            <Text style={submitButtonText}>
              {isSubmitting
                ? mode === "edit"
                  ? "Saving Changes..."
                  : providerType === "clinic"
                    ? "Adding Clinic..."
                    : "Adding Provider..."
                : mode === "edit"
                  ? "Save Changes"
                  : providerType === "clinic"
                    ? "Add Clinic"
                    : "Add Provider"}
            </Text>
          </HapticButton>

          {footer}
        </>
      ) : null}
    </ScrollView>
  );
}

type ControlledFloatingInputProps<TName extends ProviderTextFieldName> = {
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  control: Control<ProviderFormData>;
  keyboardType?: "default" | "number-pad" | "phone-pad";
  labelText: string;
  name: TName;
  placeholder?: string;
  required?: boolean;
  rules?: ControllerProps<ProviderFormData, TName>["rules"];
  transformValue?: (value: string) => string;
};

function ControlledFloatingInput<TName extends ProviderTextFieldName>({
  autoCapitalize,
  control,
  keyboardType,
  labelText,
  name,
  placeholder,
  required = false,
  rules,
  transformValue,
}: ControlledFloatingInputProps<TName>) {
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
            autoCapitalize={autoCapitalize}
            keyboardType={keyboardType}
            onBlur={inputField.onBlur}
            onChangeText={(value) =>
              inputField.onChange(transformValue ? transformValue(value) : value)
            }
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

function RequiredLabel({
  children,
  style,
}: {
  children: ReactNode;
  style: object;
}) {
  return (
    <Text style={style}>
      {children}
      <Text style={styles.requiredIndicator}> *</Text>
    </Text>
  );
}

function StatePickerTrigger({
  onPress,
  value,
}: {
  onPress: () => void;
  value: string;
}) {
  return (
    <View style={[field, fieldStack]}>
      <Text style={label}>State</Text>
      <HapticButton onPress={onPress} style={styles.pickerTrigger}>
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          numberOfLines={1}
          style={[
            styles.pickerTriggerText,
            value ? null : styles.pickerPlaceholder,
          ]}
        >
          {value || "Choose a state"}
        </Text>
      </HapticButton>
    </View>
  );
}

type VisitScheduleFieldsProps = {
  control: Control<ProviderFormData>;
  nextAppointmentStatus: ProviderFormData["nextAppointmentStatus"];
  providerType: ProviderFormData["type"];
  reminderLeadDays: ProviderFormData["reminderLeadDays"];
  scheduleAnswer: ProviderFormData["scheduleAnswer"];
  secondReminderLeadDays: ProviderFormData["secondReminderLeadDays"];
  setValue: UseFormSetValue<ProviderFormData>;
};

type ProviderTextFieldName =
  | "firstName"
  | "lastName"
  | "clinicName"
  | "specialty"
  | "phoneNumber"
  | "imageUrl"
  | "streetAddress"
  | "city"
  | "zipCode";

function VisitScheduleFields({
  control,
  nextAppointmentStatus,
  providerType,
  reminderLeadDays,
  scheduleAnswer,
  secondReminderLeadDays,
  setValue,
}: VisitScheduleFieldsProps) {
  const isAnnualFrequency = scheduleAnswer === "annual_months";

  return (
    <View style={styles.scheduleSection}>
      <Text style={styles.scheduleTitle}>Usual visit months</Text>
      <Text style={styles.scheduleDescription}>
        Select the months you normally see this {providerType}. We will use them
        to help you stay ahead of future visits.
      </Text>

      <Controller
        control={control}
        name="annualMonths"
        rules={{
          validate: (months) =>
            scheduleAnswer !== "annual_months" ||
            months.length > 0 ||
            "Choose at least one visit month.",
        }}
        render={({ field: monthsField, fieldState }) => (
          <>
            <View style={styles.monthGrid}>
              {visitMonths.map((month, index) => {
                const monthNumber = index + 1;
                const isSelected = monthsField.value.includes(monthNumber);

                return (
                  <HapticButton
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    key={month}
                    onPress={() => {
                      const nextMonths = isSelected
                        ? monthsField.value.filter(
                            (selectedMonth) => selectedMonth !== monthNumber,
                          )
                        : [...monthsField.value, monthNumber].sort(
                            (left, right) => left - right,
                          );

                      monthsField.onChange(nextMonths);
                      monthsField.onBlur();
                      setValue(
                        "scheduleAnswer",
                        nextMonths.length ? "annual_months" : "",
                        { shouldDirty: true, shouldValidate: true },
                      );

                      if (nextMonths.length === 0) {
                        setValue("nextAppointmentStatus", "", {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                        setValue("secondReminderLeadDays", null, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }
                    }}
                    style={[
                      styles.monthButton,
                      isSelected ? styles.scheduleOptionActive : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.monthButtonText,
                        isSelected ? styles.scheduleOptionTextActive : null,
                      ]}
                    >
                      {month.slice(0, 3)}
                    </Text>
                  </HapticButton>
                );
              })}
            </View>
            {fieldState.isTouched && fieldState.error ? (
              <Text style={styles.errorText}>{fieldState.error.message}</Text>
            ) : null}
          </>
        )}
      />

      <Controller
        control={control}
        name="scheduleAnswer"
        rules={{ required: "Choose visit months or select another answer." }}
        render={({ field: answerField, fieldState }) => (
          <>
            <View style={styles.scheduleAnswerRow}>
              {[
                { label: "No regular schedule", value: "none" },
                { label: "I'm not sure", value: "unsure" },
              ].map((answer) => {
                const isSelected = answerField.value === answer.value;

                return (
                  <HapticButton
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    key={answer.value}
                    onPress={() => {
                      answerField.onChange(answer.value);
                      answerField.onBlur();
                      setValue("annualMonths", [], {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setValue("nextAppointmentStatus", "", {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setValue("secondReminderLeadDays", null, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    style={[
                      styles.scheduleAnswerButton,
                      isSelected ? styles.scheduleOptionActive : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.scheduleAnswerText,
                        isSelected ? styles.scheduleOptionTextActive : null,
                      ]}
                    >
                      {answer.label}
                    </Text>
                  </HapticButton>
                );
              })}
            </View>
            {fieldState.isTouched && fieldState.error ? (
              <Text style={styles.errorText}>{fieldState.error.message}</Text>
            ) : null}
          </>
        )}
      />

      {isAnnualFrequency ? (
        <View style={styles.followUpSection}>
          <RequiredLabel style={styles.groupLabel}>
            Is your next visit already booked?
          </RequiredLabel>
          <Controller
            control={control}
            name="nextAppointmentStatus"
            rules={{ required: "Choose an answer about your next visit." }}
            render={({ field: statusField, fieldState }) => (
              <>
                <View style={styles.verticalOptions}>
                  {appointmentStatuses.map((status) => {
                    const isSelected = statusField.value === status.value;

                    return (
                      <HapticButton
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        key={status.value}
                        onPress={() => {
                          statusField.onChange(status.value);
                          statusField.onBlur();
                          if (status.value !== "not_scheduled") {
                            setValue("secondReminderLeadDays", null, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }
                        }}
                        style={[
                          styles.fullWidthOption,
                          isSelected ? styles.scheduleOptionActive : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.scheduleAnswerText,
                            isSelected
                              ? styles.scheduleOptionTextActive
                              : null,
                          ]}
                        >
                          {status.label}
                        </Text>
                      </HapticButton>
                    );
                  })}
                </View>
                {fieldState.isTouched && fieldState.error ? (
                  <Text style={styles.errorText}>
                    {fieldState.error.message}
                  </Text>
                ) : null}
              </>
            )}
          />

          {nextAppointmentStatus === "not_scheduled" ? (
            <View style={styles.reminderSection}>
              <RequiredLabel style={styles.groupLabel}>
                Remind me before the visit month
              </RequiredLabel>
              <Controller
                control={control}
                name="reminderLeadDays"
                render={({ field: reminderField }) => (
                  <View style={styles.leadTimeGrid}>
                    {reminderLeadTimes.map((leadTime) => {
                      const isSelected = reminderField.value === leadTime.value;

                      return (
                        <HapticButton
                          accessibilityRole="button"
                          accessibilityState={{ selected: isSelected }}
                          key={leadTime.value}
                          onPress={() => {
                            reminderField.onChange(leadTime.value);
                            if (secondReminderLeadDays === leadTime.value) {
                              setValue("secondReminderLeadDays", null, {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                            }
                          }}
                          style={[
                            styles.leadTimeButton,
                            isSelected ? styles.scheduleOptionActive : null,
                          ]}
                        >
                          <Text
                            style={[
                              styles.leadTimeText,
                              isSelected
                                ? styles.scheduleOptionTextActive
                                : null,
                            ]}
                          >
                            {leadTime.label}
                          </Text>
                        </HapticButton>
                      );
                    })}
                  </View>
                )}
              />

              {secondReminderLeadDays === null ? (
                <HapticButton
                  accessibilityRole="button"
                  onPress={() => {
                    const defaultLeadTime =
                      secondReminderDefaults.find(
                        (leadTime) => leadTime !== reminderLeadDays,
                      ) ?? null;

                    setValue("secondReminderLeadDays", defaultLeadTime, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  style={styles.addReminderButton}
                >
                  <Text style={styles.addReminderText}>+ Add second reminder</Text>
                </HapticButton>
              ) : (
                <Controller
                  control={control}
                  name="secondReminderLeadDays"
                  rules={{
                    validate: (value) =>
                      value === null ||
                      value !== reminderLeadDays ||
                      "Choose a different time for the second reminder.",
                  }}
                  render={({ field: secondReminderField, fieldState }) => (
                    <View style={styles.secondReminderSection}>
                      <View style={styles.secondReminderHeader}>
                        <Text style={styles.groupLabel}>Second reminder</Text>
                        <HapticButton
                          accessibilityRole="button"
                          onPress={() => secondReminderField.onChange(null)}
                          style={styles.removeReminderButton}
                        >
                          <Text style={styles.removeReminderText}>Remove</Text>
                        </HapticButton>
                      </View>
                      <View style={styles.leadTimeGrid}>
                        {reminderLeadTimes
                          .filter(
                            (leadTime) => leadTime.value !== reminderLeadDays,
                          )
                          .map((leadTime) => {
                            const isSelected =
                              secondReminderField.value === leadTime.value;

                            return (
                              <HapticButton
                                accessibilityRole="button"
                                accessibilityState={{ selected: isSelected }}
                                key={leadTime.value}
                                onPress={() =>
                                  secondReminderField.onChange(leadTime.value)
                                }
                                style={[
                                  styles.leadTimeButton,
                                  isSelected
                                    ? styles.scheduleOptionActive
                                    : null,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.leadTimeText,
                                    isSelected
                                      ? styles.scheduleOptionTextActive
                                      : null,
                                  ]}
                                >
                                  {leadTime.label}
                                </Text>
                              </HapticButton>
                            );
                          })}
                      </View>
                      {fieldState.error ? (
                        <Text style={styles.errorText}>
                          {fieldState.error.message}
                        </Text>
                      ) : null}
                    </View>
                  )}
                />
              )}
            </View>
          ) : null}

          {nextAppointmentStatus === "scheduled" ? (
            <Text style={styles.scheduleHelper}>
              You can add the exact appointment date in the appointments area.
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function formatPhoneNumber(value: string) {
  let digits = value.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    digits = digits.slice(1);
  }

  digits = digits.slice(0, 10);

  if (digits.length <= 3) {
    return digits ? `(${digits}` : "";
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function isValidImageUrl(value: string) {
  if (!value.trim()) {
    return true;
  }

  try {
    const url = new URL(value.trim());

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getProviderFormDefaults(formData: ProviderFormData): ProviderFormData {
  return {
    ...formData,
    careMemberIds: [...formData.careMemberIds],
    annualMonths: [...formData.annualMonths],
    phoneNumber: formatPhoneNumber(formData.phoneNumber),
  };
}

function buildProviderPayload(
  formData: ProviderFormData,
  mode: "create" | "edit",
): CreateProviderInput {
  const isProvider = formData.type === "provider";
  const hasVisitSchedule =
    formData.scheduleAnswer === "annual_months" &&
    formData.annualMonths.length > 0 &&
    Boolean(formData.nextAppointmentStatus);
  const visitSchedule = hasVisitSchedule
    ? {
        annualMonths: [...formData.annualMonths].sort(
          (left, right) => left - right,
        ),
        reminderLeadDays:
          formData.nextAppointmentStatus === "not_scheduled"
            ? formData.reminderLeadDays
            : undefined,
        secondReminderLeadDays:
          formData.nextAppointmentStatus === "not_scheduled"
            ? formData.secondReminderLeadDays ?? undefined
            : undefined,
        nextAppointmentStatus: formData.nextAppointmentStatus || "unsure",
      }
    : mode === "edit"
      ? null
      : undefined;

  return {
    isForAccountOwner: formData.isForAccountOwner,
    careMemberIds: [...new Set(formData.careMemberIds)],
    firstName: isProvider ? formData.firstName.trim() : undefined,
    lastName: isProvider ? formData.lastName.trim() : undefined,
    clinicName: isProvider ? undefined : formData.clinicName.trim(),
    specialty: formData.specialty.trim(),
    phoneNumber: formData.phoneNumber || undefined,
    type: formData.type || "provider",
    imageUrl: formData.imageUrl.trim() || undefined,
    streetAddress: isProvider
      ? undefined
      : formData.streetAddress.trim() || undefined,
    city: isProvider ? undefined : formData.city.trim() || undefined,
    state: isProvider ? undefined : formData.state.trim() || undefined,
    zipCode: isProvider ? undefined : formData.zipCode || undefined,
    visitSchedule,
  };
}

const styles = StyleSheet.create({
  form: {
    gap: 18,
    paddingBottom: 112,
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
  halfWidth: {
    width: "50%",
  },
  pickerTrigger: {
    backgroundColor: "#ffffff",
    borderColor: "#d9e1ea",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingBottom: 12,
    paddingHorizontal: 14,
    paddingTop: 16,
  },
  pickerTriggerText: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 16,
    fontWeight: fontWeights.regular,
  },
  pickerPlaceholder: {
    color: "#8a96a8",
  },
  statePicker: {
    color: colors.primary,
    fontFamily: fonts.body,
    height: 216,
    width: "100%",
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
  scheduleSection: {
    borderTopColor: "rgba(31, 53, 87, 0.12)",
    borderTopWidth: 1,
    gap: 12,
    marginTop: 4,
    paddingTop: 20,
  },
  scheduleTitle: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 17,
    fontWeight: fontWeights.semibold,
  },
  scheduleDescription: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    marginTop: -6,
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  monthButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#d9e1ea",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    width: "31%",
  },
  monthButtonText: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: fontWeights.semibold,
  },
  scheduleAnswerRow: {
    flexDirection: "row",
    gap: 8,
  },
  scheduleAnswerButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#d9e1ea",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  scheduleAnswerText: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: fontWeights.semibold,
    lineHeight: 18,
    textAlign: "center",
  },
  scheduleOptionActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  scheduleOptionTextActive: {
    color: "#ffffff",
  },
  followUpSection: {
    borderTopColor: "rgba(31, 53, 87, 0.1)",
    borderTopWidth: 1,
    gap: 12,
    marginTop: 4,
    paddingTop: 16,
  },
  verticalOptions: {
    gap: 8,
  },
  fullWidthOption: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#d9e1ea",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  reminderSection: {
    gap: 10,
  },
  addReminderButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderColor: "rgba(31, 53, 87, 0.28)",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 12,
  },
  addReminderText: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: fontWeights.semibold,
  },
  secondReminderSection: {
    gap: 10,
    marginTop: 4,
  },
  secondReminderHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  removeReminderButton: {
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 4,
  },
  removeReminderText: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: fontWeights.semibold,
  },
  leadTimeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  leadTimeButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#d9e1ea",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 8,
    width: "48.5%",
  },
  leadTimeText: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: fontWeights.semibold,
    textAlign: "center",
  },
  scheduleHelper: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
  },
});
