import { HapticButton } from "@/components/common/HapticButton";
import { PickerModal } from "@/components/common/PickerModal";
import { providerTypes } from "@/data/providerTypes";
import { usStates } from "@/data/usStates";
import { useCreateProvider } from "@/hooks/useCreateProvider";
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
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

const phoneNumberRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
const zipCodeRegex = /^\d{5}$/;

export const initialProviderFormData: ProviderFormData = {
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
};

type AddProviderFormProps = {
  footer?: ReactNode;
  initialData?: ProviderFormData;
  mode?: "create" | "edit";
  onCreateSuccess?: () => void;
  onEditSubmit?: (formData: ProviderFormData) => void | Promise<void>;
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
  const createProviderMutation = useCreateProvider();
  const { showToast } = useToast();
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [draftState, setDraftState] = useState(formDefaults.state);
  const {
    control,
    handleSubmit,
    reset,
    trigger,
    watch,
    formState: { isSubmitting, isValid },
  } = useForm<ProviderFormData>({
    defaultValues: formDefaults,
    mode: "onChange",
  });
  const providerType = watch("type");

  useEffect(() => {
    void trigger(["firstName", "lastName", "clinicName", "specialty"]);
  }, [providerType, trigger]);

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
    const normalizedFormData = normalizeProviderFormData(formData);

    if (mode === "edit") {
      await onEditSubmit?.(normalizedFormData);
      return;
    }

    if (!token) {
      return;
    }

    try {
      await createProviderMutation.mutateAsync([
        {
          ...normalizedFormData,
          type: normalizedFormData.type || "provider",
        },
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
                  : "Adding Provider..."
                : mode === "edit"
                  ? "Save Changes"
                  : "Add Provider"}
            </Text>
          </HapticButton>

          {footer}
        </>
      ) : null}
    </ScrollView>
  );
}

type ControlledFloatingInputProps = {
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  control: Control<ProviderFormData>;
  keyboardType?: "default" | "number-pad" | "phone-pad";
  labelText: string;
  name: keyof ProviderFormData;
  placeholder?: string;
  required?: boolean;
  rules?: ControllerProps<ProviderFormData>["rules"];
  transformValue?: (value: string) => string;
};

function ControlledFloatingInput({
  autoCapitalize,
  control,
  keyboardType,
  labelText,
  name,
  placeholder,
  required = false,
  rules,
  transformValue,
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
    phoneNumber: formatPhoneNumber(formData.phoneNumber),
  };
}

function normalizeProviderFormData(
  formData: ProviderFormData,
): ProviderFormData {
  const isProvider = formData.type === "provider";

  return {
    firstName: isProvider ? formData.firstName.trim() : "",
    lastName: isProvider ? formData.lastName.trim() : "",
    clinicName: isProvider ? "" : formData.clinicName.trim(),
    specialty: formData.specialty.trim(),
    phoneNumber: formData.phoneNumber,
    type: formData.type,
    imageUrl: formData.imageUrl.trim(),
    streetAddress: isProvider ? "" : formData.streetAddress.trim(),
    city: isProvider ? "" : formData.city.trim(),
    state: isProvider ? "" : formData.state.trim(),
    zipCode: isProvider ? "" : formData.zipCode,
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
});
