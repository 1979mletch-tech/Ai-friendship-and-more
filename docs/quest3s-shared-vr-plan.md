# Quest 3S — Shared VR for Aurora and Owner Aurora

## Goal
Build a shared WebXR renderer with separate user experiences and security contexts:
- Public Aurora: opt-in comforting face-to-face conversations, seated environments and voluntary virtual hand interactions.
- Owner Aurora: private owner-authenticated project workspace in VR, no bypass of server-side owner entitlement.

## Delivery stages
1. VR capability detection in Quest Browser, desktop 2D fallback, accessible exit and recenter controls.
2. Calm room and lakeside scene, comfortable seated position, reduced motion, avatar rendering.
3. Voice input/output with explicit mic permission, clear mute, stop and captions.
4. Hand tracking where supported; optional visual hand-holding with explicit interaction, easy release and no misleading promise of physical touch.
5. Independent security testing for adult verification, owner-only workspace, account isolation, consent and privacy.

## Technical direction
WebXR + Three.js / React Three Fiber, feature-detected in Quest Browser. Share renderer and avatar rig but keep public and owner session boundaries independent. No unnecessary geolocation or recording. Never expose owner notes to public Aurora.

## Asset gate
The user requested a particular blonde Aurora. Do not silently substitute an unrelated blonde stock image. Confirm the exact approved image asset before changing `public/aurora-portrait.webp`, which is currently referenced by AuroraPresence. VR avatar must be visually approved separately; a flat portrait does not automatically become a rigged 3D model.

## Launch gate
Not production-ready until Quest 3S device test, accessibility checks, privacy and safety review, and explicit deployment approval.
