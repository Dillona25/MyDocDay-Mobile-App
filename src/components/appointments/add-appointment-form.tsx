import { appointmentTypes } from "@/data/appointmentTypes";
import { useProviders } from "@/hooks/useProviders";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import type {
  AppointmentFormData,
  AppointmentProviderSelection,
} from "@/types/appointment-form";
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

const otherDoctorValue = "other";

const providerOptions = [
  { label: "Saved Provider", value: "saved" },
  { label: "Different Provider", value: otherDoctorValue },
] as const;

const initialAppointmentFormData: AppointmentFormData = {
  title: "",
  date: "",
  startTime: "",
  appointmentType: "",
  providerSelection: "",
  providerId: "",
  doctorName: "",
};

export default function AddAppointmentForm() {
  const { error, isLoading, providers } = useProviders();
  const [formData, setFormData] = useState(initialAppointmentFormData);
  const selectedProviderMode = formData.providerSelection;

  useFocusEffect(
    useCallback(() => {
      return () => {
        setFormData(initialAppointmentFormData);
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

  return (
    <ScrollView contentContainerStyle={styles.form}>
      <FloatingInput
        labelText="Appointment Title"
        onChangeText={(value) => updateField("title", value)}
        value={formData.title}
      />

      <View style={styles.fieldsRow}>
        <FloatingInput
          labelText="Date"
          onChangeText={(value) => updateField("date", value)}
          placeholder="YYYY-MM-DD"
          value={formData.date}
        />
        <FloatingInput
          labelText="Start Time"
          onChangeText={(value) => updateField("startTime", value)}
          placeholder="10:00 AM"
          value={formData.startTime}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.groupLabel}>Appointment Type</Text>
        <View style={segmentedRow}>
          {appointmentTypes.map((typeOption) => {
            const isActive = formData.appointmentType === typeOption.value;

            return (
              <Pressable
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
              </Pressable>
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
              <Pressable
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
              </Pressable>
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
              <Pressable
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
              </Pressable>
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

      <Pressable style={submitButton}>
        <Text style={submitButtonText}>Add Appointment</Text>
      </Pressable>
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
