import { HapticButton } from "@/components/common/HapticButton";
import { useAuth } from "@/store/auth/AuthContext";
import { colors } from "@/theme/colors";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Redirect, router, Tabs } from "expo-router";
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
        tabBarInactiveTintColor: "#526783",
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
        listeners={{
          tabPress: (event) => {
            event.preventDefault();
            router.navigate("/appointments");
          },
        }}
        options={{
          popToTopOnBlur: true,
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
        listeners={{
          tabPress: (event) => {
            event.preventDefault();
            router.navigate("/providers");
          },
        }}
        options={{
          popToTopOnBlur: true,
          title: "Providers",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="providers" />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        listeners={{
          tabPress: (event) => {
            event.preventDefault();
            router.navigate("/reminders");
          },
        }}
        options={{
          popToTopOnBlur: true,
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
      <Tabs.Screen
        name="account"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="edit-profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="family"
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
        elevated && focused && styles.iconFrameElevatedActive,
      ]}
    >
      <Image
        contentFit="contain"
        source={tabIconSources[name]}
        style={[
          elevated ? styles.iconElevated : styles.icon,
          { tintColor: elevated ? "#ffffff" : color },
        ]}
      />
      {focused && !elevated ? <View style={styles.activeIndicator} /> : null}
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
    borderTopWidth: 1,
    elevation: 14,
    height: 88,
    paddingBottom: 17,
    paddingTop: 11,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.14,
    shadowRadius: 12,
  },
  tabBarItem: {
    paddingVertical: 4,
  },
  iconFrame: {
    alignItems: "center",
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    width: 52,
  },
  iconFrameActive: {
    backgroundColor: "transparent",
  },
  iconFrameInactive: {
    backgroundColor: "transparent",
  },
  activeIndicator: {
    backgroundColor: colors.secondary,
    borderRadius: 2,
    bottom: 1,
    height: 3,
    position: "absolute",
    width: 18,
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
    backgroundColor: colors.primary,
    borderColor: "#ffffff",
    borderRadius: 32,
    borderWidth: 4,
    height: 64,
    shadowColor: "#081426",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    transform: [{ translateY: -15 }],
    width: 64,
    elevation: 8,
  },
  iconFrameElevatedActive: {
    backgroundColor: colors.secondary,
  },
});
