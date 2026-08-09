import { ToastType } from "@/app/(app)/addition";
import { useAuth } from "@/auth/AuthContext";
import { providerTypes } from "@/data/providerTypes";
import { useCreateProvider } from "@/hooks/useCreateProvider";
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
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { HapticButton } from "../common/HapticButton";

const initialProviderFormData: ProviderFormData = {
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
  onSuccess: (message: string, type: ToastType) => void;
};

export default function AddProviderForm({ onSuccess }: AddProviderFormProps) {
  const [formData, setFormData] = useState(initialProviderFormData);
  const providerType = formData.type;
  const { token } = useAuth();
  const createProviderMutation = useCreateProvider();

  useFocusEffect(
    useCallback(() => {
      return () => {
        setFormData(initialProviderFormData);
      };
    }, []),
  );

  function updateField(fieldName: keyof ProviderFormData, value: string) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [fieldName]: value,
    }));
  }

  async function onSubmitPress(formData: ProviderFormData) {
    console.log("formData:", formData);

    if (!token) {
      return;
    }

    try {
      await createProviderMutation.mutateAsync([
        {
          ...formData,
          type: formData.type || "provider",
          firstName: formData.type === "provider" ? formData.firstName : "",
          lastName: formData.type === "provider" ? formData.lastName : "",
          clinicName: formData.type === "clinic" ? formData.clinicName : "",
        },
        token,
      ]);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess("Provider added successfully", "success");

      // Clears our form..
      setFormData({
        type: "",
        firstName: "",
        lastName: "",
        clinicName: "",
        specialty: "",
        phoneNumber: "",
        imageUrl: "",
        streetAddress: "",
        city: "",
        state: "",
        zipCode: "",
      });
    } catch (error) {
      console.log(error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      onSuccess("Something went wrong with the request", "error");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.form}>
      <View style={styles.fieldGroup}>
        <Text style={styles.groupLabel}>Is this a provider or clinic?</Text>
        <View style={segmentedRow}>
          {providerTypes.map((typeOption) => {
            const isActive = providerType === typeOption.value;

            return (
              <Pressable
                key={typeOption.value}
                onPress={() => updateField("type", typeOption.value)}
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
              </Pressable>
            );
          })}
        </View>
      </View>

      {providerType === "provider" ? (
        <View style={styles.fieldsRow}>
          <FloatingInput
            labelText="First Name"
            onChangeText={(value) => updateField("firstName", value)}
            value={formData.firstName}
          />
          <FloatingInput
            labelText="Last Name"
            onChangeText={(value) => updateField("lastName", value)}
            value={formData.lastName}
          />
        </View>
      ) : null}

      {providerType === "clinic" ? (
        <FloatingInput
          labelText="Clinic Name"
          onChangeText={(value) => updateField("clinicName", value)}
          value={formData.clinicName}
        />
      ) : null}

      {providerType ? (
        <>
          <View style={styles.fieldsRow}>
            <FloatingInput
              labelText={
                providerType === "clinic" ? "Clinic Type" : "Provider Specialty"
              }
              onChangeText={(value) => updateField("specialty", value)}
              value={formData.specialty}
            />
            <FloatingInput
              keyboardType="phone-pad"
              labelText="Phone Number"
              onChangeText={(value) => updateField("phoneNumber", value)}
              value={formData.phoneNumber}
            />
          </View>

          <FloatingInput
            autoCapitalize="none"
            labelText={
              providerType === "clinic"
                ? "Clinic Image URL"
                : "Provider Image URL"
            }
            onChangeText={(value) => updateField("imageUrl", value)}
            placeholder="Google image link"
            value={formData.imageUrl}
          />

          {providerType === "clinic" ? (
            <>
              <FloatingInput
                labelText="Street Address"
                onChangeText={(value) => updateField("streetAddress", value)}
                value={formData.streetAddress}
              />

              <View style={styles.fieldsRow}>
                <FloatingInput
                  labelText="City"
                  onChangeText={(value) => updateField("city", value)}
                  value={formData.city}
                />
                <FloatingInput
                  labelText="State"
                  onChangeText={(value) => updateField("state", value)}
                  placeholder="Ex. CA"
                  value={formData.state}
                />
              </View>

              <View style={styles.halfWidth}>
                <FloatingInput
                  keyboardType="number-pad"
                  labelText="ZIP Code"
                  onChangeText={(value) => updateField("zipCode", value)}
                  value={formData.zipCode}
                />
              </View>
            </>
          ) : null}

          <HapticButton
            style={submitButton}
            onPress={() => onSubmitPress(formData)}
          >
            <Text style={submitButtonText}>Add Provider</Text>
          </HapticButton>
        </>
      ) : null}
    </ScrollView>
  );
}

type FloatingInputProps = {
  labelText: string;
  value: string;
  onChangeText: (value: string) => void;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "number-pad" | "phone-pad";
  placeholder?: string;
};

function FloatingInput({
  autoCapitalize,
  keyboardType,
  labelText,
  onChangeText,
  placeholder,
  value,
}: FloatingInputProps) {
  return (
    <View style={[field, fieldStack]}>
      <Text style={label}>{labelText}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8a96a8"
        style={textInput}
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
  halfWidth: {
    width: "50%",
  },
});
