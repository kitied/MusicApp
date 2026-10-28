# NOIR Music

Native iOS offline music player with direct audio stream URLs. Built using Expo SDK 58, React Native, and TypeScript.

## Implemented in prototype

- Import audio from Files and copy it to persistent app documents storage.
- Save direct HTTP(S) audio URLs and play them as streams.
- Persistent track library, search, delete (long press a track).
- Full-screen player and floating mini-player, playback controls.
- Background audio mode and iOS lock-screen metadata configured.
- Dark translucent, glass-inspired layout.

## Run locally on Windows

1. Install Node.js LTS and Git.
2. Run `npm ci` in this directory.
3. Run `npx expo start` for development. **Note:** iOS Expo Go may not support SDK 58 or the native background mode; the custom iOS build is the target.

## First iPhone build (experimental — not yet verified on iOS 27.2)

1. Push this project as the **root** of a GitHub repository. Do not commit personal music or credentials.
2. Open **Actions → Build unsigned iOS IPA → Run workflow**.
3. If successful, download the `NOIR-Music-unsigned-ipa` artifact and extract the `.ipa` from the ZIP.
4. Install Sideloadly on Windows, connect iPhone, and load the `.ipa` using your own Apple ID.
5. If requested, enable **Developer Mode** and trust the developer profile on iPhone.

**Known constraints:** Unsigned cloud builds and Sideloadly compatibility with iOS 27.2 have not been tested end to end. A free Apple ID signs apps for 7 days; refresh regularly. GitHub Actions standard macOS runners are free for public repositories, while private repositories consume a limited quota. Public repositories expose source code, so never put music files, passwords, or private API keys in the repo.

## Next improvements

Metadata artwork/artist parsing, playlists and queue UI, seek slider, stream buffering and connection retry, granular track list, error recovery, accessibility and UI polish.
