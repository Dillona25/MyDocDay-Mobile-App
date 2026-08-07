import { useAuth } from "@/auth/AuthContext";
import { colors } from "@/theme/colors";
import { Image } from "expo-image";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

type TabIconName = "home" | "appointments" | "providers" | "reminders";

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
    </Tabs>
  );
}

function TabIcon({
  color,
  focused,
  name,
}: {
  color: string;
  focused: boolean;
  name: TabIconName;
}) {
  return (
    <View
      style={[
        styles.iconFrame,
        focused ? styles.iconFrameActive : styles.iconFrameInactive,
      ]}
    >
      <Image
        contentFit="contain"
        source={tabIconSources[name]}
        style={[styles.icon, { tintColor: color }]}
      />
    </View>
  );
}

const tabIconSources: Record<TabIconName, number> = {
  home: require("../../assets/house-solid-full.svg"),
  appointments: require("../../assets/calendar-solid-full.svg"),
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
    backgroundColor: "rgba(28, 184, 178, 0.16)",
  },
  iconFrameInactive: {
    backgroundColor: "transparent",
  },
  icon: {
    height: 25,
    width: 25,
  },
});
