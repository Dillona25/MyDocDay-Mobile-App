import { Linking, Platform } from "react-native";

export async function openLocationInMaps(location: string) {
  const encodedLocation = encodeURIComponent(location);
  const mapsUrl =
    Platform.OS === "ios"
      ? `https://maps.apple.com/?q=${encodedLocation}`
      : `geo:0,0?q=${encodedLocation}`;

  await Linking.openURL(mapsUrl);
}
