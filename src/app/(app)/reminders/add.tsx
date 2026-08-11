import { BackButton } from "@/components/common/BackButton";
import AddCareTaskForm from "@/components/reminders/add-care-task-form";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function AddTaskScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <BackButton href="/reminders" navigationMode="dismiss" />

        <View style={styles.header}>
          <Text style={styles.eyebrow}>Health Reminders</Text>
          <Text style={styles.title}>Add a Health Reminder</Text>
          <Text style={styles.description}>
            Choose when you need to be reminded so important care stays visible.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <AddCareTaskForm />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f4f7fa",
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  header: {
    gap: 8,
    marginTop: 8,
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
  description: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
    paddingTop: 24,
  },
});
