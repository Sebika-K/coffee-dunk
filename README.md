<p align="center">
  <img src="mobile/assets/images/icon.png" alt="Coffee Dunk icon" width="120" />
</p>

<h1 align="center">Coffee Dunk</h1>

<p align="center">A cozy, friends-only coffee journal app.<br/>
Log every cup, see what your friends are drinking, and find cafes worth the trip.</p>

---

## What it does

- **Coffee journal:** post a photo of your drink with the drink, milk, hot or iced, tasting notes and a star rating. Posts are either at a café or homemade, with a step-by-step recipe.
- **Friends-only feed:** posts are only visible to you and the friends you've accepted. Likes are private: only the person who posted sees who liked it.
- **Personal coffee diary:** your stats (posts, cafés tried, average rating) plus your most-ordered drink, highest-rated drink and favourite tasting note.
- **Café discovery:** search any city or use "Near me" for cafés ranked by a fair "top rated" score. Café pages show the photo, address, opening hours, directions, call and website, plus **"What to order here"**, built from everyone's ratings anonymously.
- **Recommendations:** "For you" suggests cafés based on what you and your friends enjoyed, and "Where your friends went" shows cafés from your friends' recent posts.
- **Saves:** bookmark friends' posts to come back to.
- **Safety and privacy:** report and block from any post or profile, Terms of Use agreed at signup, a privacy policy, password reset and in-app account deletion.

## Tech stack

| Part                       | Built with                                                                |
| -------------------------- | ------------------------------------------------------------------------- |
| Mobile app                 | [Expo](https://expo.dev) (SDK 57) + Expo Router, React Native, TypeScript |
| Accounts, database, photos | Firebase Authentication, Cloud Firestore, Cloud Storage                   |
| Backend API                | Python + Flask, running on Google Cloud Run                               |
| Café data                  | Google Maps Platform, Places API (search, autocomplete, details, photos)  |
| Web pages                  | Firebase Hosting (password reset, Terms of Use, Privacy Policy)           |

## How it fits together

```
                 ┌──────────────────────────────┐
                 │  Mobile app (Expo / RN / TS) │
                 └──────┬─────────────────┬─────┘
   accounts, posts,     │                 │  café search, café details,
   friends, likes       │                 │  top drinks, recommendations,
   (direct, secured by  │                 │  account deletion
   Firestore rules)     ▼                 ▼
          ┌─────────────────────┐   ┌──────────────────────────┐
          │ Firebase            │◄──│ Flask API (Cloud Run)     │
          │ Auth · Firestore ·  │   │ keeps the Google key      │
          │ Storage · Hosting   │   │ secret, runs server logic │
          └─────────────────────┘   └────────────┬─────────────┘
                                                 ▼
                                    ┌──────────────────────────┐
                                    │ Google Places API         │
                                    └──────────────────────────┘
```

- The app talks to **Firebase directly** for everyday things such as posting, the feed and friends. **Firestore security rules** (`firebase/firestore.rules`) enforce privacy on the server: posts can only be read by their owner and accepted friends.
- The **Flask backend** handles anything that needs a secret key or has to see more than one person's data: Google Places requests (so the API key never ships inside the app), anonymous "top drinks" across all posts, recommendations, and deleting an account with everything that belongs to it.

## Project structure

```
coffee-dunk/
├── mobile/                  # the Expo app
│   ├── src/app/             # screens (Expo Router: every file is a screen)
│   │   ├── (app)/(tabs)/    #   feed, search (Discover + café pages), profile
│   │   └── (app)/           #   post, friend profile, upload/edit, settings, friends…
│   ├── src/components/      # reusable pieces (FeedCard, CafeInfo, Avatar, BeanBackground…)
│   ├── src/lib/             # Firebase + API helpers (posts, friends, likes, safety…)
│   ├── src/hooks/           # custom hooks (place suggestions, keyboard state)
│   ├── src/constants/       # colours (theme.ts) and drink options
│   └── assets/images/       # hand-drawn art, icon, splash
├── backend/                 # Flask API
│   ├── app.py
│   ├── routes/              # cafe_routes.py, account_routes.py + pure helpers
│   │                        #   (ranking, drink_stats, privacy, parsing)
│   ├── tests/               # unit tests for the helpers
│   └── scripts/             # one-off maintenance scripts
├── firebase/
│   ├── firestore.rules      # who can read and write what
│   └── hosting/             # password reset, terms and privacy pages
└── firebase.json
```

## Running it locally

### What you need

- Node.js and npm
- Python 3
- A Firebase project (Authentication with email/password, Firestore, Storage)
- A Google Maps Platform API key with the **Places API** and **Geocoding API** enabled
- The **Expo Go** app on your phone

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Add the two secrets, which are **git-ignored**, so never commit them:

- `backend/.env` containing `GOOGLE_API_KEY=your-places-key`
- `backend/secrets/firebase-key.json`: a Firebase service-account key (Firebase console → Project settings → Service accounts)

Start the server:

```bash
python -m flask --app app run --debug --port 5001 --host 0.0.0.0
```

### 2. Mobile app

```bash
cd mobile
npm install
cp .env.example .env.local   # then fill in your Firebase web app config
```

In `.env.local`, point `EXPO_PUBLIC_API_URL` at your backend, for example your computer's local IP address (`http://192.168.x.x:5001`) or your Cloud Run URL. Then:

```bash
npx expo start
```

Scan the QR code with Expo Go. After changing `.env.local`, restart with `npx expo start -c`.

### 3. Checks

```bash
# mobile: type check
cd mobile && npx tsc --noEmit

# backend: unit tests
cd backend && python3 -m unittest discover -s tests -t .
```

## Deploying

```bash
# Backend → Google Cloud Run (from backend/)
gcloud run deploy coffee-dunk-api --source . --region us-central1 --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_PROJECT=<project-id>,GOOGLE_API_KEY=<places-key>

# Firestore rules and web pages (from the repo root)
npx firebase-tools deploy --only firestore:rules
npx firebase-tools deploy --only hosting
```

## Status

Coffee Dunk is a personal project. It runs on real phones through Expo Go, and it's set up for release (bundle ID, icon, splash, Terms of Use, Privacy Policy, account deletion, report and block), but it isn't published on the App Store or Google Play.

## Author

Built by **Sebika Khulal**, who also drew all the illustrations, from the heart mug to the floating coffee beans. ☕
