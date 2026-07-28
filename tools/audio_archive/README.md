# Audio archive (not shipped in Production)

Moved out of `public/` so Vite production builds do not copy them into `dist/`.

- `_softsynth_backup/` — old generated BGM/SFX backups
- `public_audio_unused/` — root-level duplicates / backups no longer referenced by Runtime paths

Do not delete without an explicit archive cleanup task.
