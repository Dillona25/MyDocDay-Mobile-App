import { HapticButton } from "@/components/common/HapticButton";
import { useAuth } from "@/store/auth/AuthContext";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import type { CareMember } from "@/types/care-member";
import { StyleSheet, Text, View } from "react-native";

type CarePersonSelectorProps = {
  careMembers: CareMember[];
  errorMessage?: string;
  isLoading?: boolean;
  multiple?: boolean;
  onChange: (selection: {
    isForAccountOwner: boolean;
    careMemberIds: number[];
  }) => void;
  selectedCareMemberIds: number[];
  selectedForAccountOwner: boolean;
};

export function CarePersonSelector({
  careMembers,
  errorMessage,
  isLoading = false,
  multiple = false,
  onChange,
  selectedCareMemberIds,
  selectedForAccountOwner,
}: CarePersonSelectorProps) {
  const { user } = useAuth();

  function selectOwner() {
    onChange({
      isForAccountOwner: multiple ? !selectedForAccountOwner : true,
      careMemberIds: multiple ? selectedCareMemberIds : [],
    });
  }

  function selectMember(careMemberId: number) {
    if (!multiple) {
      onChange({ isForAccountOwner: false, careMemberIds: [careMemberId] });
      return;
    }

    onChange({
      isForAccountOwner: selectedForAccountOwner,
      careMemberIds: selectedCareMemberIds.includes(careMemberId)
        ? selectedCareMemberIds.filter((id) => id !== careMemberId)
        : [...selectedCareMemberIds, careMemberId],
    });
  }

  return (
    <View style={styles.group}>
      <Text style={styles.label}>Who is this for?</Text>
      <View style={styles.options}>
        <PersonOption
          isSelected={selectedForAccountOwner}
          label={user?.firstName || "Account owner"}
          onPress={selectOwner}
        />
        {careMembers.map((member) => (
          <PersonOption
            isSelected={selectedCareMemberIds.includes(member.id)}
            key={member.id}
            label={member.firstName}
            onPress={() => selectMember(member.id)}
          />
        ))}
      </View>
      {isLoading ? <Text style={styles.helper}>Loading family...</Text> : null}
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
}

function PersonOption({
  isSelected,
  label,
  onPress,
}: {
  isSelected: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <HapticButton
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={[styles.option, isSelected ? styles.optionSelected : null]}
    >
      <Text
        style={[
          styles.optionText,
          isSelected ? styles.optionTextSelected : null,
        ]}
      >
        {label}
      </Text>
    </HapticButton>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 10,
  },
  label: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: fontWeights.semibold,
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  option: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#d9e1ea",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    minWidth: 64,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  optionSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  optionText: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: fontWeights.semibold,
  },
  optionTextSelected: {
    color: "#ffffff",
  },
  helper: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 12,
  },
  error: {
    color: "#d24747",
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
  },
});
