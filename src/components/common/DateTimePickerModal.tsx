import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { PickerModal } from "./PickerModal";

type DateTimePickerModalProps = {
  maximumDate?: Date;
  minimumDate?: Date;
  mode: "date" | "time";
  onClose: () => void;
  onDone: (value: Date) => void;
  title: string;
  value: Date;
  visible: boolean;
};

export function DateTimePickerModal({
  maximumDate,
  minimumDate,
  mode,
  onClose,
  onDone,
  title,
  value,
  visible,
}: DateTimePickerModalProps) {
  const [draftValue, setDraftValue] = useState(value);

  useEffect(() => {
    if (visible) {
      setDraftValue(value);
    }
  }, [value, visible]);

  function handleDateChange(event: DateTimePickerEvent, date?: Date) {
    if (event.type === "set" && date) {
      setDraftValue(date);
    }
  }

  return (
    <PickerModal
      onClose={onClose}
      onDone={() => onDone(draftValue)}
      title={title}
      visible={visible}
    >
      {mode === "date" ? (
        <DateTimePicker
          display="spinner"
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          mode="date"
          onChange={handleDateChange}
          style={styles.datePicker}
          textColor={colors.primary}
          value={draftValue}
        />
      ) : (
        <TimeWheelPicker onChange={setDraftValue} value={draftValue} />
      )}
    </PickerModal>
  );
}

const hourOptions = Array.from({ length: 12 }, (_, index) => index + 1);
const minuteOptions = Array.from({ length: 60 }, (_, index) => index);

function TimeWheelPicker({
  onChange,
  value,
}: {
  onChange: (date: Date) => void;
  value: Date;
}) {
  const period = value.getHours() >= 12 ? "PM" : "AM";
  const hour = value.getHours() % 12 || 12;

  function updateTime(nextHour: number, nextMinute: number, nextPeriod: string) {
    const nextValue = new Date(value);
    const hour24 =
      nextPeriod === "PM" ? (nextHour % 12) + 12 : nextHour % 12;

    nextValue.setHours(hour24, nextMinute, 0, 0);
    onChange(nextValue);
  }

  return (
    <View style={styles.timeWheelRow}>
      <Picker
        onValueChange={(nextHour) =>
          updateTime(Number(nextHour), value.getMinutes(), period)
        }
        selectedValue={hour}
        style={styles.timeWheel}
      >
        {hourOptions.map((hourOption) => (
          <Picker.Item
            key={hourOption}
            label={String(hourOption)}
            value={hourOption}
          />
        ))}
      </Picker>

      <Picker
        onValueChange={(nextMinute) =>
          updateTime(hour, Number(nextMinute), period)
        }
        selectedValue={value.getMinutes()}
        style={styles.timeWheel}
      >
        {minuteOptions.map((minuteOption) => (
          <Picker.Item
            key={minuteOption}
            label={String(minuteOption).padStart(2, "0")}
            value={minuteOption}
          />
        ))}
      </Picker>

      <Picker
        onValueChange={(nextPeriod) =>
          updateTime(hour, value.getMinutes(), String(nextPeriod))
        }
        selectedValue={period}
        style={styles.timeWheel}
      >
        <Picker.Item label="AM" value="AM" />
        <Picker.Item label="PM" value="PM" />
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  datePicker: {
    height: 216,
    width: "100%",
  },
  timeWheelRow: {
    flexDirection: "row",
    height: 216,
  },
  timeWheel: {
    color: colors.primary,
    flex: 1,
    fontFamily: fonts.body,
  },
});
