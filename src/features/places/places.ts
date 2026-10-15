/** Map searches open only after an explicit user click. No location permission needed. */
export function googleMapsPlaceUrl(place: string): string | null {
  const clean = place.trim().replace(/\s+/g, " ");
  if (!clean || clean.length > 200) return null;
  const url = new URL("https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set("query", clean);
  return url.toString();
}

export function openPlaceInMaps(place: string): boolean {
  const url = googleMapsPlaceUrl(place);
  if (!url || typeof window === "undefined") return false;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}
