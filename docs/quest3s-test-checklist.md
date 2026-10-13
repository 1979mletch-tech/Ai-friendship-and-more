# Aurora Quest 3S acceptance checklist

Status: **NOT VERIFIED**. Do not merge or deploy without green checks.

## Code and build
- [ ] npm ci
- [ ] npm run typecheck
- [ ] npm run test
- [ ] npm run build
- [ ] Check desktop/mobile fallback when navigator.xr is missing

## Quest 3S device
- [ ] Open site over HTTPS in Quest Browser
- [ ] Adult gate enforced before public Aurora immersive entry
- [ ] VR support detected and explicit user action enters VR
- [ ] Background renders in headset (initial room shell only)
- [ ] Exit works and browser resumes normally
- [ ] Permission denied produces usable fallback
- [ ] Session exit/re-entry does not leak a WebGL session
- [ ] Comfort buttons never animate without explicit consent

## Future features (not yet implemented)
- [ ] Rigged approved blonde 3D avatar matching reference
- [ ] Animated hand-holding/hug/pat with opt-in and release
- [ ] Voice conversation in VR, captions, mute and stop
- [ ] Owner Aurora route secured by server-side owner eligibility
- [ ] Full accessibility and motion-comfort checks

## Approved portrait
Reference image was supplied in chat. The current website references public/aurora-portrait.webp. The portrait must be replaced with an appropriately cropped image asset from the supplied reference, not a substitute. This binary asset is not yet committed to the repository.
