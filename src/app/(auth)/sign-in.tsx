import { signInUser } from "@/api/auth/sign-in";
import { HapticButton } from "@/components/common/HapticButton";
import { useAuth } from "@/store/auth/AuthContext";
import { buttonDisabled, buttonPrimary, buttonText } from "@/theme/buttons";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import { fieldStack, label, textInput } from "@/theme/forms";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const screenHeight = Dimensions.get("window").height;

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);
  const { saveSession } = useAuth();

  const trimmedEmail = email.trim();
  const emailIsValid = emailRegex.test(trimmedEmail);
  const passwordIsValid = password.length >= 8;
  const formIsValid = emailIsValid && passwordIsValid;

  function scrollToFormBottom() {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }

  function markTouched(field: keyof typeof touched) {
    setTouched((currentTouched) => ({
      ...currentTouched,
      [field]: true,
    }));
  }

  async function handleSignIn() {
    markTouched("email");
    markTouched("password");

    if (!formIsValid || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const result = await signInUser({
        email: trimmedEmail,
        password,
      });

      await saveSession({
        token: result.session.token,
        user: result.user,
      });
      router.replace("/dashboard");
    } catch (error) {
      if (error instanceof Error) {
        setSubmitMessage(error.message);
      } else {
        setSubmitMessage("Unable to sign in right now.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
          style={styles.keyboardView}
        >
          <ScrollView
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={styles.content}
            ref={scrollViewRef}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
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
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    onChangeText={setEmail}
                    onFocus={scrollToFormBottom}
                    onBlur={() => markTouched("email")}
                    placeholder="you@example.com"
                    placeholderTextColor="#8a96a8"
                    style={[
                      styles.input,
                      touched.email && !emailIsValid ? styles.inputError : null,
                    ]}
                    textContentType="emailAddress"
                    value={email}
                  />
                  {touched.email && !emailIsValid ? (
                    <Text style={styles.errorText}>
                      Enter a valid email address.
                    </Text>
                  ) : null}
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    onChangeText={setPassword}
                    onFocus={scrollToFormBottom}
                    onBlur={() => markTouched("password")}
                    placeholder="Enter your password"
                    placeholderTextColor="#8a96a8"
                    secureTextEntry
                    style={[
                      styles.input,
                      touched.password && !passwordIsValid
                        ? styles.inputError
                        : null,
                    ]}
                    textContentType="password"
                    value={password}
                  />
                  {touched.password && !passwordIsValid ? (
                    <Text style={styles.errorText}>
                      Password must be at least 8 characters.
                    </Text>
                  ) : null}
                </View>
                <HapticButton
                  disabled={!formIsValid || isSubmitting}
                  onPress={handleSignIn}
                  style={[
                    buttonPrimary,
                    !formIsValid || isSubmitting ? buttonDisabled : null,
                  ]}
                >
                  <Text style={buttonText}>
                    {isSubmitting ? "Signing in..." : "Sign in"}
                  </Text>
                </HapticButton>
                {submitMessage ? (
                  <Text style={[styles.submitMessage, styles.submitError]}>
                    {submitMessage}
                  </Text>
                ) : null}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f4f7fa",
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    minHeight: screenHeight - 96,
    paddingBottom: 56,
    paddingHorizontal: 24,
    paddingTop: 28,
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
