import { getCareMemberImageSource } from "@/api/care-members/care-members";
import { HapticButton } from "@/components/common/HapticButton";
import { PickerModal } from "@/components/common/PickerModal";
import { useAuth } from "@/store/auth/AuthContext";
import { useToast } from "@/store/ToastContext";
import {
  buttonDisabled,
  buttonSecondary,
  buttonSubmit,
  buttonSubmitText,
  buttonText,
} from "@/theme/buttons";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import { fieldStack, label, textInput } from "@/theme/forms";
import type {
  CareMember,
  CareMemberFormData,
  CareMemberFormSubmission,
} from "@/types/care-member";
import { Picker } from "@react-native-picker/picker";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, Text, TextInput, View } from "react-native";

const relationshipOptions = [
  "Partner or spouse",
  "Child",
  "Parent",
  "Sibling",
  "Relative",
  "Friend",
  "Other",
] as const;

type FamilyMemberFormProps = {
  careMember?: CareMember;
  footer?: ReactNode;
  isSubmitting: boolean;
  mode: "add" | "edit";
  onSubmit: (submission: CareMemberFormSubmission) => Promise<void>;
};

export function FamilyMemberForm({
  careMember,
  footer,
  isSubmitting,
  mode,
  onSubmit,
}: FamilyMemberFormProps) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [shouldRemoveImage, setShouldRemoveImage] = useState(false);
  const [showRelationshipPicker, setShowRelationshipPicker] = useState(false);
  const [draftRelationship, setDraftRelationship] = useState(
    careMember?.relationship ?? "",
  );
  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<CareMemberFormData>({
    defaultValues: {
      firstName: careMember?.firstName ?? "",
      lastName: careMember?.lastName ?? "",
      relationship: careMember?.relationship ?? "",
    },
    mode: "onChange",
  });
  const savedImageSource = getCareMemberImageSource(
    careMember?.profileImageUrl,
    token,
  );
  const displayedImageSource = selectedImageUri
    ? { uri: selectedImageUri }
    : shouldRemoveImage
      ? null
      : savedImageSource;
  const initials = `${careMember?.firstName.charAt(0) ?? ""}${careMember?.lastName?.charAt(0) ?? ""}`.toUpperCase() || "?";

  async function chooseImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        mediaTypes: ["images"],
        quality: 0.9,
      });

      if (result.canceled) return;

      const imageContext = ImageManipulator.manipulate(result.assets[0].uri);
      imageContext.resize({ width: 512, height: 512 });
      const renderedImage = await imageContext.renderAsync();
      const processedImage = await renderedImage.saveAsync({
        compress: 0.78,
        format: SaveFormat.JPEG,
      });

      setSelectedImageUri(processedImage.uri);
      setShouldRemoveImage(false);
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast("Unable to open that image", "error");
    }
  }

  function removeImage() {
    setSelectedImageUri(null);
    setShouldRemoveImage(Boolean(careMember?.profileImageUrl));
  }

  return (
    <View style={styles.form}>
      <View style={styles.photoSection}>
        <View style={styles.avatarFrame}>
          {displayedImageSource ? (
            <Image
              contentFit="cover"
              source={displayedImageSource}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarText}>{initials}</Text>
          )}
        </View>
        <View style={styles.photoActions}>
          <HapticButton onPress={chooseImage} style={buttonSecondary}>
            <Text style={buttonText}>Choose photo</Text>
          </HapticButton>
          {displayedImageSource ? (
            <HapticButton onPress={removeImage} style={styles.removePhotoButton}>
              <Text style={styles.removePhotoText}>Remove photo</Text>
            </HapticButton>
          ) : null}
        </View>
      </View>

      <View style={styles.fieldsRow}>
        <Controller
          control={control}
          name="firstName"
          rules={{
            maxLength: {
              value: 100,
              message: "First name cannot exceed 100 characters.",
            },
            validate: (value) =>
              value.trim().length > 0 || "First name is required.",
          }}
          render={({ field, fieldState }) => (
            <View style={[styles.field, fieldStack]}>
              <RequiredLabel>First Name</RequiredLabel>
              <TextInput
                autoCapitalize="words"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                style={[
                  textInput,
                  fieldState.isTouched && fieldState.invalid
                    ? styles.inputError
                    : null,
                ]}
                value={field.value}
              />
              {fieldState.isTouched && fieldState.error ? (
                <Text style={styles.errorText}>{fieldState.error.message}</Text>
              ) : null}
            </View>
          )}
        />

        <Controller
          control={control}
          name="lastName"
          rules={{
            maxLength: {
              value: 100,
              message: "Last name cannot exceed 100 characters.",
            },
          }}
          render={({ field, fieldState }) => (
            <View style={[styles.field, fieldStack]}>
              <Text style={label}>Last Name</Text>
              <TextInput
                autoCapitalize="words"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                style={[
                  textInput,
                  fieldState.isTouched && fieldState.invalid
                    ? styles.inputError
                    : null,
                ]}
                value={field.value}
              />
              {fieldState.isTouched && fieldState.error ? (
                <Text style={styles.errorText}>{fieldState.error.message}</Text>
              ) : null}
            </View>
          )}
        />
      </View>

      <Controller
        control={control}
        name="relationship"
        rules={{ required: "Relationship is required." }}
        render={({ field, fieldState }) => (
          <View style={fieldStack}>
            <RequiredLabel>Relationship</RequiredLabel>
            <HapticButton
              onPress={() => {
                setDraftRelationship(field.value);
                setShowRelationshipPicker(true);
              }}
              style={[
                styles.pickerTrigger,
                fieldState.isTouched && fieldState.invalid
                  ? styles.inputError
                  : null,
              ]}
            >
              <Text
                style={[
                  styles.pickerText,
                  field.value ? null : styles.placeholderText,
                ]}
              >
                {field.value || "Select relationship"}
              </Text>
            </HapticButton>
            {fieldState.isTouched && fieldState.error ? (
              <Text style={styles.errorText}>{fieldState.error.message}</Text>
            ) : null}

            <PickerModal
              onClose={() => setShowRelationshipPicker(false)}
              onDone={() => {
                field.onChange(draftRelationship);
                field.onBlur();
                setShowRelationshipPicker(false);
              }}
              title="Choose relationship"
              visible={showRelationshipPicker}
            >
              <Picker
                onValueChange={(value) => setDraftRelationship(String(value))}
                selectedValue={draftRelationship}
                style={styles.picker}
              >
                <Picker.Item label="Select relationship" value="" />
                {relationshipOptions.map((relationship) => (
                  <Picker.Item
                    key={relationship}
                    label={relationship}
                    value={relationship}
                  />
                ))}
              </Picker>
            </PickerModal>
          </View>
        )}
      />

      <HapticButton
        disabled={!isValid || isSubmitting}
        onPress={handleSubmit((values) =>
          onSubmit({
            input: {
              firstName: values.firstName.trim(),
              lastName: values.lastName.trim() || undefined,
              relationship: values.relationship,
            },
            selectedImageUri,
            shouldRemoveImage,
          }),
        )}
        style={[
          buttonSubmit,
          !isValid || isSubmitting ? buttonDisabled : null,
        ]}
      >
        <Text style={buttonSubmitText}>
          {isSubmitting
            ? mode === "add"
              ? "Adding..."
              : "Saving..."
            : mode === "add"
              ? "Add Family Member"
              : "Save Changes"}
        </Text>
      </HapticButton>

      {footer}
    </View>
  );
}

function RequiredLabel({ children }: { children: string }) {
  return (
    <Text style={label}>
      {children}
      <Text style={styles.requiredIndicator}> *</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  form: { gap: 18 },
  photoSection: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "rgba(31, 53, 87, 0.08)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 18,
    padding: 18,
  },
  avatarFrame: {
    alignItems: "center",
    backgroundColor: "rgba(28, 184, 178, 0.18)",
    borderRadius: 42,
    height: 84,
    justifyContent: "center",
    overflow: "hidden",
    width: 84,
  },
  avatarImage: { height: "100%", width: "100%" },
  avatarText: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 25,
    fontWeight: fontWeights.bold,
  },
  photoActions: { flex: 1, gap: 8 },
  removePhotoButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
  },
  removePhotoText: {
    color: "#d24747",
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: fontWeights.semibold,
  },
  fieldsRow: { flexDirection: "row", gap: 12 },
  field: { flex: 1, minWidth: 0 },
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
  pickerText: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  placeholderText: { color: "#8a96a8" },
  picker: {
    color: colors.primary,
    fontFamily: fonts.body,
    height: 216,
    width: "100%",
  },
  requiredIndicator: { color: "#d24747" },
  inputError: { borderColor: "#d24747" },
  errorText: {
    color: "#d24747",
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
  },
});
