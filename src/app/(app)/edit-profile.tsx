import {
  deleteUserProfileImage,
  getUserProfileImageSource,
  updateUserProfile,
  uploadUserProfileImage,
  type UpdateUserProfileInput,
} from "@/api/users/profile";
import { HapticButton } from "@/components/common/HapticButton";
import { PickerModal } from "@/components/common/PickerModal";
import { getStateAbbreviation, usStates } from "@/data/usStates";
import { useAuth } from "@/store/auth/AuthContext";
import { useToast } from "@/store/ToastContext";
import {
  buttonDisabled,
  buttonPrimary,
  buttonSecondary,
  buttonText,
} from "@/theme/buttons";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import { field, fieldStack, label, textInput } from "@/theme/forms";
import { Picker } from "@react-native-picker/picker";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Controller,
  type Control,
  type ControllerProps,
  useForm,
} from "react-hook-form";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function EditProfileScreen() {
  const { token, updateUser, user } = useAuth();
  const { showToast } = useToast();
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [shouldRemoveImage, setShouldRemoveImage] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [draftState, setDraftState] = useState(
    getStateAbbreviation(user?.state ?? ""),
  );
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting, isValid },
  } = useForm<UpdateUserProfileInput>({
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      city: user?.city ?? "",
      state: getStateAbbreviation(user?.state ?? ""),
    },
    mode: "onChange",
  });
  const currentImageSource = getUserProfileImageSource(
    user?.profileImageUrl,
    token,
  );
  const displayedImageSource = selectedImageUri
    ? { uri: selectedImageUri }
    : shouldRemoveImage
      ? null
      : currentImageSource;
  const hasImageChange = Boolean(selectedImageUri || shouldRemoveImage);
  const hasChanges = isDirty || hasImageChange;

  useFocusEffect(
    useCallback(() => {
      const profileValues = {
        firstName: user?.firstName ?? "",
        lastName: user?.lastName ?? "",
        city: user?.city ?? "",
        state: getStateAbbreviation(user?.state ?? ""),
      };

      reset(profileValues);
      setDraftState(profileValues.state);
      setSelectedImageUri(null);
      setShouldRemoveImage(false);
      setShowStatePicker(false);
    }, [reset, user]),
  );

  async function chooseProfileImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        mediaTypes: ["images"],
        quality: 0.9,
      });

      if (result.canceled) {
        return;
      }

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

  function removeProfileImage() {
    setSelectedImageUri(null);
    setShouldRemoveImage(Boolean(user?.profileImageUrl));
  }

  async function saveProfile(values: UpdateUserProfileInput) {
    if (!token || !user) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast("Your session has expired. Please sign in again.", "error");
      return;
    }

    try {
      let nextUser = user;

      if (isDirty) {
        const profileResult = await updateUserProfile(
          {
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            city: values.city.trim(),
            state: values.state.trim(),
          },
          token,
        );

        nextUser = profileResult.user;
        updateUser(nextUser);
      }

      if (selectedImageUri) {
        const imageResult = await uploadUserProfileImage(
          selectedImageUri,
          token,
        );

        nextUser = imageResult.user;
      } else if (shouldRemoveImage) {
        const imageResult = await deleteUserProfileImage(token);

        nextUser = imageResult.user;
      }

      updateUser(nextUser);
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      showToast("Profile updated successfully", "success");
      router.replace("/account");
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(
        error instanceof Error ? error.message : "Unable to update your profile",
        "error",
      );
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.content}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Profile</Text>
          <Text style={styles.title}>Edit Profile</Text>
        </View>

        <View style={styles.photoSection}>
          <View style={styles.profileImageFrame}>
            {displayedImageSource ? (
              <Image
                contentFit="cover"
                source={displayedImageSource}
                style={styles.profileImage}
              />
            ) : (
              <Text style={styles.profileInitials}>
                {getInitials(user?.firstName, user?.lastName)}
              </Text>
            )}
          </View>
          <View style={styles.photoActions}>
            <HapticButton
              onPress={chooseProfileImage}
              style={buttonSecondary}
            >
              <Text style={buttonText}>Choose photo</Text>
            </HapticButton>
            {displayedImageSource ? (
              <HapticButton
                onPress={removeProfileImage}
                style={styles.removePhotoButton}
              >
                <Text style={styles.removePhotoText}>Remove photo</Text>
              </HapticButton>
            ) : null}
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldsRow}>
            <ProfileInput
              control={control}
              labelText="First Name"
              name="firstName"
              rules={{
                maxLength: {
                  value: 100,
                  message: "First name cannot exceed 100 characters.",
                },
                validate: (value) =>
                  value.trim().length > 0 || "First name is required.",
              }}
            />
            <ProfileInput
              control={control}
              labelText="Last Name"
              name="lastName"
              rules={{
                maxLength: {
                  value: 100,
                  message: "Last name cannot exceed 100 characters.",
                },
                validate: (value) =>
                  value.trim().length > 0 || "Last name is required.",
              }}
            />
          </View>

          <View style={styles.fieldsRow}>
            <ProfileInput
              control={control}
              labelText="City"
              name="city"
              rules={{
                maxLength: {
                  value: 100,
                  message: "City cannot exceed 100 characters.",
                },
                validate: (value) =>
                  value.trim().length > 0 || "City is required.",
              }}
            />
            <Controller
              control={control}
              name="state"
              rules={{ required: "State is required." }}
              render={({ field: stateField, fieldState }) => (
                <View style={[field, fieldStack]}>
                  <RequiredLabel>State</RequiredLabel>
                  <HapticButton
                    onPress={() => {
                      setDraftState(stateField.value);
                      setShowStatePicker(true);
                    }}
                    style={[
                      styles.stateTrigger,
                      fieldState.isTouched && fieldState.invalid
                        ? styles.inputError
                        : null,
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.stateText,
                        stateField.value ? null : styles.placeholderText,
                      ]}
                    >
                      {stateField.value || "Choose a state"}
                    </Text>
                  </HapticButton>
                  {fieldState.isTouched && fieldState.error ? (
                    <Text style={styles.errorText}>
                      {fieldState.error.message}
                    </Text>
                  ) : null}

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
                          value={stateOption.abbreviation}
                        />
                      ))}
                    </Picker>
                  </PickerModal>
                </View>
              )}
            />
          </View>

          <HapticButton
            disabled={!isValid || !hasChanges || isSubmitting}
            onPress={handleSubmit(saveProfile)}
            style={[
              buttonPrimary,
              !isValid || !hasChanges || isSubmitting ? buttonDisabled : null,
            ]}
          >
            <Text style={buttonText}>
              {isSubmitting ? "Saving Changes..." : "Save Changes"}
            </Text>
          </HapticButton>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type ProfileInputProps = {
  control: Control<UpdateUserProfileInput>;
  labelText: string;
  name: keyof UpdateUserProfileInput;
  rules: ControllerProps<UpdateUserProfileInput>["rules"];
};

function ProfileInput({
  control,
  labelText,
  name,
  rules,
}: ProfileInputProps) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: inputField, fieldState }) => (
        <View style={[field, fieldStack]}>
          <RequiredLabel>{labelText}</RequiredLabel>
          <TextInput
            onBlur={inputField.onBlur}
            onChangeText={inputField.onChange}
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

function RequiredLabel({ children }: { children: string }) {
  return (
    <Text style={label}>
      {children}
      <Text style={styles.requiredIndicator}> *</Text>
    </Text>
  );
}

function getInitials(firstName?: string, lastName?: string) {
  return `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`.toUpperCase() || "?";
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f4f7fa",
    flex: 1,
  },
  content: {
    gap: 24,
    paddingBottom: 120,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  header: {
    gap: 8,
  },
  eyebrow: {
    color: colors.secondary,
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: fontWeights.bold,
    textTransform: "uppercase",
  },
  title: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 30,
    fontWeight: fontWeights.bold,
    lineHeight: 36,
  },
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
  profileImageFrame: {
    alignItems: "center",
    backgroundColor: "rgba(28, 184, 178, 0.18)",
    borderRadius: 42,
    height: 84,
    justifyContent: "center",
    overflow: "hidden",
    width: 84,
  },
  profileImage: {
    height: "100%",
    width: "100%",
  },
  profileInitials: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 25,
    fontWeight: fontWeights.bold,
  },
  photoActions: {
    flex: 1,
    gap: 8,
  },
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
  form: {
    gap: 18,
  },
  fieldsRow: {
    flexDirection: "row",
    gap: 12,
  },
  stateTrigger: {
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
  stateText: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  placeholderText: {
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
