import { signInUser } from "@/api/auth/sign-in";
import { HapticButton } from "@/components/common/HapticButton";
import { useAuth } from "@/store/auth/AuthContext";
import {
  buttonDisabled,
  buttonSubmit,
  buttonSubmitText,
} from "@/theme/buttons";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import { fieldStack, label, textInput } from "@/theme/forms";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { useRef } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SignInFormValues = {
  email: string;
  password: string;
};

export default function SignInScreen() {
  const passwordInputRef = useRef<TextInput>(null);
  const { saveSession } = useAuth();
  const {
    clearErrors,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<SignInFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  async function handleSignIn(values: SignInFormValues) {
    clearErrors("root.server");

    try {
      const result = await signInUser({
        email: values.email.trim(),
        password: values.password,
      });

      await saveSession({
        token: result.session.token,
        user: result.user,
      });
      router.replace("/dashboard");
    } catch (error) {
      setError("root.server", {
        message:
          error instanceof Error
            ? error.message
            : "Unable to sign in right now.",
      });
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
        <View>
          <Image
            contentFit="contain"
            source={require("../../assets/Signin-graphic.svg")}
            style={styles.graphic}
          />

          <View style={styles.copyGroup}>
            <Text style={styles.eyebrow}>Welcome back</Text>
            <Text style={styles.title}>Sign in to MyDocDay</Text>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              rules={{
                required: "Email is required.",
                validate: (value) =>
                  emailRegex.test(value.trim()) ||
                  "Enter a valid email address.",
              }}
              render={({ field, fieldState }) => (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    autoCapitalize="none"
                    autoComplete="email"
                    blurOnSubmit={false}
                    keyboardType="email-address"
                    onBlur={field.onBlur}
                    onChangeText={field.onChange}
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                    placeholder="you@example.com"
                    placeholderTextColor="#8a96a8"
                    ref={field.ref}
                    returnKeyType="next"
                    style={[
                      styles.input,
                      fieldState.isTouched && fieldState.invalid
                        ? styles.inputError
                        : null,
                    ]}
                    textContentType="emailAddress"
                    value={field.value}
                  />
                  {fieldState.isTouched && fieldState.error ? (
                    <Text style={styles.errorText}>
                      {fieldState.error.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />

            <Controller
              control={control}
              name="password"
              rules={{
                required: "Password is required.",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters.",
                },
              }}
              render={({ field, fieldState }) => (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    ref={(input) => {
                      field.ref(input);
                      passwordInputRef.current = input;
                    }}
                    onBlur={field.onBlur}
                    onChangeText={field.onChange}
                    onSubmitEditing={handleSubmit(handleSignIn)}
                    placeholder="Enter your password"
                    placeholderTextColor="#8a96a8"
                    returnKeyType="done"
                    secureTextEntry
                    style={[
                      styles.input,
                      fieldState.isTouched && fieldState.invalid
                        ? styles.inputError
                        : null,
                    ]}
                    textContentType="password"
                    value={field.value}
                  />
                  {fieldState.isTouched && fieldState.error ? (
                    <Text style={styles.errorText}>
                      {fieldState.error.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />
            <HapticButton
              disabled={!isValid || isSubmitting}
              onPress={handleSubmit(handleSignIn)}
              style={[
                buttonSubmit,
                !isValid || isSubmitting ? buttonDisabled : null,
              ]}
            >
              <Text style={buttonSubmitText}>
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Text>
            </HapticButton>
            {errors.root?.server ? (
              <Text style={[styles.submitMessage, styles.submitError]}>
                {errors.root.server.message}
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f4f7fa",
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 112,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  graphic: {
    alignSelf: "center",
    height: 150,
    marginBottom: 18,
    width: "100%",
  },
  copyGroup: {
    marginBottom: 26,
  },
  eyebrow: {
    color: colors.secondary,
    fontFamily: fonts.heading,
    fontSize: 15,
    fontWeight: fontWeights.bold,
    marginBottom: 12,
    textAlign: "center",
  },
  title: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 34,
    fontWeight: fontWeights.bold,
    lineHeight: 40,
    textAlign: "center",
  },
  form: {
    gap: 18,
  },
  fieldGroup: {
    ...fieldStack,
  },
  label: {
    ...label,
  },
  input: {
    ...textInput,
    minHeight: 50,
  },
  inputError: {
    borderColor: "#d24747",
  },
  errorText: {
    color: "#d24747",
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  submitMessage: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  submitError: {
    color: "#d24747",
  },
});
