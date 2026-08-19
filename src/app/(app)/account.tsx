import { getUserProfileImageSource } from "@/api/users/profile";
import { BackButton } from "@/components/common/BackButton";
import { HapticButton } from "@/components/common/HapticButton";
import { useAuth } from "@/store/auth/AuthContext";
import { colors } from "@/theme/colors";
import { fonts, fontWeights } from "@/theme/fonts";
import Constants from "expo-constants";
import { Image } from "expo-image";
import { router, type Href } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

type AccountItem = {
  label: string;
  description: string;
  external?: boolean;
  href?: string;
  icon?: number;
  route?: Href;
};

const accountItems: AccountItem[] = [
  {
    label: "Edit Profile",
    description: "Name, email, and location",
    icon: require("../../assets/circle-user-solid-full.svg"),
    route: "/edit-profile",
  },
  {
    label: "Manage Family",
    description: "People whose care you help organize",
    icon: require("../../assets/people-roof-solid-full.svg"),
    route: "/family" as Href,
  },
  {
    label: "Settings",
    description: "Notifications and app preferences",
    icon: require("../../assets/gear-solid-full.svg"),
  },
];

const supportItems: AccountItem[] = [
  {
    label: "Privacy Statement",
    description: "How MyDocDay protects your information",
    external: true,
    href: "https://www.mydocday.com/legal/privacy",
  },
  {
    label: "Terms of Use",
    description: "Terms for using MyDocDay",
    external: true,
    href: "https://www.mydocday.com/legal/terms",
  },
  {
    label: "Data Consent",
    description: "How MyDocDay uses your care information",
    external: true,
    href: "https://www.mydocday.com/legal/data-consent",
  },
  {
    label: "Contact",
    description: "Get help or share feedback",
  },
];

function getInitials(firstName?: string, lastName?: string) {
  return `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`.toUpperCase() || "?";
}

export default function AccountScreen() {
  const { signOut, token, user } = useAuth();
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const location = [user?.city, user?.state].filter(Boolean).join(", ");
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";
  const profileImageSource = getUserProfileImageSource(
    user?.profileImageUrl,
    token,
  );

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <BackButton href="/dashboard" navigationMode="navigate" />
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Account</Text>
          <Text style={styles.title}>Your MyDocDay</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {profileImageSource ? (
              <Image
                contentFit="cover"
                source={profileImageSource}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>
                {getInitials(user?.firstName, user?.lastName)}
              </Text>
            )}
          </View>
          <View style={styles.profileDetails}>
            <Text numberOfLines={1} style={styles.profileName}>
              {fullName || "MyDocDay Member"}
            </Text>
            <Text numberOfLines={1} style={styles.profileEmail}>
              {user?.email ?? ""}
            </Text>
            <Text numberOfLines={1} style={styles.profileLocation}>
              {location || "Location not added"}
            </Text>
          </View>
        </View>

        <AccountSection items={accountItems} title="Profile & app" />
          <AccountSection items={supportItems} title="Legal & support" />

        <HapticButton
          accessibilityRole="button"
          onPress={signOut}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </HapticButton>

        <Text style={styles.versionText}>MyDocDay {appVersion}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function AccountSection({
  items,
  title,
}: {
  items: AccountItem[];
  title: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionPanel}>
        {items.map((item, index) => (
          <AccountRow
            item={item}
            key={item.label}
            showBorder={index < items.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

function AccountRow({
  item,
  showBorder,
}: {
  item: AccountItem;
  showBorder: boolean;
}) {
  const hasAction = Boolean(item.href || item.route);
  const rowStyle = [styles.menuRow, showBorder ? styles.menuRowBorder : null];
  const content = (
    <>
      {item.icon ? (
        <View style={styles.menuIconFrame}>
          <Image
            contentFit="contain"
            source={item.icon}
            style={styles.menuIcon}
          />
        </View>
      ) : null}
      <View style={styles.menuCopy}>
        <Text style={styles.menuLabel}>{item.label}</Text>
        <Text style={styles.menuDescription}>{item.description}</Text>
      </View>
      {!hasAction ? (
        <View style={styles.soonBadge}>
          <Text style={styles.soonText}>Soon</Text>
        </View>
      ) : null}
      {item.external ? (
        <Image
          contentFit="contain"
          source={require("../../assets/arrow-up-right-from-square-solid-full.svg")}
          style={[
            styles.externalIcon,
            !item.href ? styles.externalIconMuted : null,
          ]}
        />
      ) : null}
      {item.route ? (
        <Image
          contentFit="contain"
          source={require("../../assets/caret-right-solid-full.svg")}
          style={styles.rowCaret}
        />
      ) : null}
    </>
  );

  if (!hasAction) {
    return <View style={rowStyle}>{content}</View>;
  }

  return (
    <HapticButton
      accessibilityLabel={`Open ${item.label}`}
      accessibilityRole={item.href ? "link" : "button"}
      onPress={() => {
        if (item.route) {
          router.push(item.route);
          return;
        }

        if (item.href) {
          void WebBrowser.openBrowserAsync(item.href);
        }
      }}
      style={rowStyle}
    >
      {content}
    </HapticButton>
  );
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
  profileCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "rgba(31, 53, 87, 0.08)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    padding: 18,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "rgba(28, 184, 178, 0.18)",
    borderRadius: 30,
    height: 60,
    justifyContent: "center",
    overflow: "hidden",
    width: 60,
  },
  avatarText: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 20,
    fontWeight: fontWeights.bold,
  },
  avatarImage: {
    height: "100%",
    width: "100%",
  },
  profileDetails: {
    flex: 1,
    marginLeft: 14,
    minWidth: 0,
  },
  profileName: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 19,
    fontWeight: fontWeights.semibold,
  },
  profileEmail: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: 3,
  },
  profileLocation: {
    color: colors.secondary,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: fontWeights.medium,
    marginTop: 7,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: "#536173",
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: fontWeights.semibold,
    textTransform: "uppercase",
  },
  sectionPanel: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(31, 53, 87, 0.08)",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuRow: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  menuRowBorder: {
    borderBottomColor: "rgba(31, 53, 87, 0.08)",
    borderBottomWidth: 1,
  },
  menuIconFrame: {
    alignItems: "center",
    backgroundColor: "rgba(28, 184, 178, 0.14)",
    borderRadius: 8,
    height: 38,
    justifyContent: "center",
    marginRight: 12,
    width: 38,
  },
  menuIcon: {
    height: 19,
    tintColor: colors.primary,
    width: 19,
  },
  menuCopy: {
    flex: 1,
    minWidth: 0,
  },
  menuLabel: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 15,
    fontWeight: fontWeights.semibold,
  },
  menuDescription: {
    color: "#687588",
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  soonBadge: {
    backgroundColor: "rgba(31, 53, 87, 0.07)",
    borderRadius: 6,
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  soonText: {
    color: "#687588",
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: fontWeights.semibold,
  },
  externalIcon: {
    height: 15,
    marginLeft: 12,
    tintColor: colors.primary,
    width: 15,
  },
  externalIconMuted: {
    opacity: 0.4,
  },
  rowCaret: {
    height: 10,
    marginLeft: 12,
    tintColor: "#8a96a8",
    width: 10,
  },
  logoutButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "rgba(210, 71, 71, 0.55)",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 50,
  },
  logoutText: {
    color: "#d24747",
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: fontWeights.semibold,
  },
  versionText: {
    color: "#8a96a8",
    fontFamily: fonts.body,
    fontSize: 12,
    textAlign: "center",
  },
});
