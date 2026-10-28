# NOIR Music 0.2 (test build)

Native iOS music player for local audio and direct stream URLs. Built using Expo SDK 58, Expo Router, React Native, and TypeScript. The Yandex Music catalog is **not** integrated; imported Yandex metadata will not imply playback access.

## Implemented

- Import audio from Files and copy it to persistent app documents storage.
- Save direct HTTP(S) audio URLs and play them as streams.
- SQLite-backed library, search, liked tracks, recent plays, and delete (long press a track).
- Automatic one-time migration of the v0.1 AsyncStorage library to SQLite.
- Separate full-screen player and glass mini-player, seek-on-tap progress bar.
- Background audio mode and iOS lock-screen metadata configured, with explicit live-stream flag.
- Native Liquid Glass when available, BlurView fallback otherwise.
- Basic MP3 ID3v2.3/v2.4 metadata and embedded JPEG/PNG artwork parsing (other formats use the filename fallback).

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

M4A/FLAC metadata parsing, more robust ID3 compatibility, playlists and editable queue UI, improved seek slider, direct-stream buffering and reconnect, richer cover artwork fallback, Yandex playlist metadata import (subject to supported access), NOIR Wave recommendations, accessibility and animations.

## Updating an installed iPhone app

Build a new unsigned IPA in Actions and re-sign using the same Apple ID and bundle identifier. Update in place if Sideloadly permits it. Back up irreplaceable music before testing; deleting an iOS app can delete its documents, database and imported audio.
