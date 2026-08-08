import { useAuth } from "@/auth/AuthContext";
import { HapticButton } from "@/components/common/HapticButton";
import { colors } from "@/theme/colors";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

type TabIconName =
  | "home"
  | "appointments"
  | "addition"
  | "providers"
  | "reminders";

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/welcome" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: "#7b8798",
        tabBarShowLabel: false,
        tabBarItemStyle: styles.tabBarItem,
        tabBarStyle: styles.tabBar,
        tabBarButton: (props) => (
          <HapticButton
            {...props}
            onPress={(e) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              props.onPress?.(e);
            }}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="home" />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "Appointments",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="appointments" />
          ),
        }}
      />
      <Tabs.Screen
        name="addition"
        options={{
          title: "Addition",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon elevated color={color} focused={focused} name="addition" />
          ),
        }}
      />
      <Tabs.Screen
        name="providers"
        options={{
          title: "Providers",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="providers" />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: "Reminders",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="reminders" />
          ),
        }}
      />
      <Tabs.Screen
        name="add-appointment"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="add-provider"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  color,
  focused,
  name,
  elevated = false,
}: {
  color: string;
  focused: boolean;
  name: TabIconName;
  elevated?: boolean;
}) {
  return (
    <View
      style={[
        styles.iconFrame,
        focused ? styles.iconFrameActive : styles.iconFrameInactive,
        elevated && styles.iconFrameElevated,
      ]}
    >
      <Image
        contentFit="contain"
        source={tabIconSources[name]}
        style={[
          elevated ? styles.iconElevated : styles.icon,
          { tintColor: color },
        ]}
      />
    </View>
  );
}

const tabIconSources: Record<TabIconName, number> = {
  home: require("../../assets/house-solid-full.svg"),
  appointments: require("../../assets/calendar-solid-full.svg"),
  addition: require("../../assets/circle-plus-solid-full.svg"),
  providers: require("../../assets/user-doctor-solid-full.svg"),
  reminders: require("../../assets/bell-solid-full.svg"),
};

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  tabBar: {
    backgroundColor: "#ffffff",
    borderTopColor: "#d9e1ea",
    height: 86,
    paddingBottom: 18,
    paddingTop: 12,
  },
  tabBarItem: {
    paddingVertical: 4,
  },
  iconFrame: {
    alignItems: "center",
    borderRadius: 14,
    height: 42,
    justifyContent: "center",
    width: 54,
  },
  iconFrameActive: {
    backgroundColor: "rgb(187, 240, 239)",
  },
  iconFrameInactive: {
    backgroundColor: "#fff",
  },
  icon: {
    height: 25,
    width: 25,
  },
  iconElevated: {
    height: 33,
    width: 33,
  },
  iconFrameElevated: {
    width: 64,
    height: 64,
    borderRadius: 20,

    transform: [{ translateY: -14 }],

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,

    elevation: 4,
  },
});
