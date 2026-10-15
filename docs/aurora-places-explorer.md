# Aurora Places Explorer — build slice

A lightweight, privacy-conscious map and satellite-view companion feature.

## Product flow
1. User mentions a lake, landmark, or town in Aurora chat.
2. Aurora offers **Explore this place** with the place name, without transmitting private chat history.
3. The user confirms the place name before opening a map.
4. Launch a Google Maps search in a new tab; the user can switch to Satellite imagery using Google Maps controls.
5. No coordinates, user location, or geolocation permission are required.

## Implementation
Use `src/features/places/places.ts` to construct safe map links. Never insert untrusted location text directly into HTML. The module intentionally avoids API keys and billable map APIs.

## Release checks
- Empty names cannot open links.
- Names are trimmed and URL encoded.
- Only https://www.google.com/maps/search/?api=1&query= is used.
- No automatic external navigation without user action.
- No map requests when chat is opened.
- Do not claim live satellite video or current imagery.

## Next integration
Attach an Explore button to the existing chat place mention UI, behind user confirmation. Do not replace existing Aurora chat or adult verification flows.
