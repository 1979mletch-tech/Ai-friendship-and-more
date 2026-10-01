# Aurora Voice — Final Reference

Approved reference direction: **Karen + Gentle + en-PL** from the device preview.

Production interpretation:
- English speech with a gentle, subtle Polish accent
- calm, soft, distinctly feminine delivery
- naturally warm and reassuring
- relaxed, unhurried pace
- slightly dreamy but still conversational
- smooth intonation and clear articulation
- natural short pauses
- no theatrical, chirpy, harsh, breathy, exaggerated sensual, monotone, or robotic delivery

The production OpenAI speech path uses `gpt-4o-mini-tts` with voice `marin`. This is not a clone of Apple's Karen voice; Karen is the approved reference for feel and pacing.

Backend status: the Supabase `speak` Edge Function has been updated to the matching production prompt. Public launch still requires a successful end-to-end playback check from the deployed frontend using a server-verified adult test account.
