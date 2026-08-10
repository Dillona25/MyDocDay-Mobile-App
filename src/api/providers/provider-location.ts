import type { Provider } from "@/types/provider";

export function formatProviderLocation(provider: Provider) {
  if (!provider.streetAddress) {
    return null;
  }

  const cityStateZip = [
    provider.city,
    [provider.state, provider.zipCode].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  return [provider.streetAddress, cityStateZip].filter(Boolean).join(", ");
}
