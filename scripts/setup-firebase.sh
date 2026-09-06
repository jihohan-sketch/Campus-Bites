#!/usr/bin/env bash
#
# Creates the Firebase project this app expects and writes .env.
#
# Run `firebase login` first — this script does not handle credentials.
#
# Everything here is a one-off. Re-running it against an existing project is
# safe except for `projects:create`, which will fail on a taken id; pass an
# existing PROJECT_ID and the script skips straight to the rest.
#
# What it CANNOT do — the Firebase CLI has no command for these, so they stay
# console clicks and the script prints them at the end:
#   * enabling the Email/Password and Google sign-in providers
#   * adding the Vercel domain to the authorised-domain list
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-vis-meal}"
DISPLAY_NAME="${DISPLAY_NAME:-VIS 급식}"
# Seoul. NEIS dates and every student are on Korean time.
LOCATION="${LOCATION:-asia-northeast3}"

say() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

say "1/5  Creating project '$PROJECT_ID'"
if firebase projects:list 2>/dev/null | grep -q "$PROJECT_ID"; then
  echo "    already exists, reusing"
else
  firebase projects:create "$PROJECT_ID" --display-name "$DISPLAY_NAME"
fi

say "2/5  Creating the Firestore database in $LOCATION"
firebase firestore:databases:create "(default)" \
  --location "$LOCATION" --project "$PROJECT_ID" || \
  echo "    already exists, continuing"

say "3/5  Registering the web app"
firebase apps:create WEB "$DISPLAY_NAME" --project "$PROJECT_ID" 2>/dev/null || \
  echo "    already registered, continuing"
APP_ID="$(firebase apps:list WEB --project "$PROJECT_ID" 2>/dev/null \
  | grep -oE '1:[0-9]+:web:[a-f0-9]+' | head -1)"
[ -n "$APP_ID" ] || { echo "could not find a web app id" >&2; exit 1; }
echo "    app id: $APP_ID"

say "4/5  Writing .env from the live SDK config"
CONFIG="$(firebase apps:sdkconfig WEB "$APP_ID" --project "$PROJECT_ID")"
# The command prints a JS snippet; pull the JSON object out of it.
JSON="$(printf '%s' "$CONFIG" | sed -n '/{/,/}/p' | tr -d '\n')"
get() { printf '%s' "$JSON" | grep -oE "\"$1\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | sed -E 's/.*"([^"]*)"$/\1/'; }

cat > .env <<EOF
# Written by scripts/setup-firebase.sh — gitignored, never commit.
EXPO_PUBLIC_FIREBASE_API_KEY=$(get apiKey)
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=$(get authDomain)
EXPO_PUBLIC_FIREBASE_PROJECT_ID=$(get projectId)
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=$(get storageBucket)
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$(get messagingSenderId)
EXPO_PUBLIC_FIREBASE_APP_ID=$(get appId)
EOF
echo "    wrote .env"

say "5/5  Deploying security rules and indexes"
# This is the step that actually enforces the @valorschool.org restriction.
firebase deploy --only firestore:rules,firestore:indexes --project "$PROJECT_ID"

cat <<EOF

────────────────────────────────────────────────────────────
Done. Two things are left that only the console can do:

1. Turn on the sign-in providers
   https://console.firebase.google.com/project/$PROJECT_ID/authentication/providers
   Enable "이메일/비밀번호" and "Google" (pick a support email).

2. Authorise the deployed domain
   https://console.firebase.google.com/project/$PROJECT_ID/authentication/settings
   Add: campus-bites-omega.vercel.app
   (localhost is already there.)

Then put the six .env values into Vercel (Production/Preview/Development)
and redeploy — EXPO_PUBLIC_* is inlined at build time, so a redeploy is
required for them to take effect.
────────────────────────────────────────────────────────────
EOF
