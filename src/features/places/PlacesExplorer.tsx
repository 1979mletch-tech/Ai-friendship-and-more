import { useState } from "react";
import { googleMapsPlaceUrl } from "./places";

export function PlacesExplorer({ suggestedPlace = "" }: { suggestedPlace?: string }) {
  const [place, setPlace] = useState(suggestedPlace);
  const url = googleMapsPlaceUrl(place);
  return (
    <section aria-label="Explore a place">
      <h2>Explore with Aurora</h2>
      <p>Discover lakes, landmarks and destinations on a map. Switch to satellite view in Google Maps.</p>
      <label htmlFor="aurora-place">Place to explore</label>
      <input id="aurora-place" value={place} maxLength={200} onChange={(event) => setPlace(event.target.value)} placeholder="e.g. Lake Windermere" />
      {url ? <a href={url} target="_blank" rel="noopener noreferrer">Explore map (opens new tab)</a> : <p>Enter a place name to continue.</p>}
      <p><small>Map imagery is provided by Google Maps and may not be current. Aurora does not access your location.</small></p>
    </section>
  );
}
