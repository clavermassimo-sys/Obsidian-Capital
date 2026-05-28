# Obsidian Capital — Mobile App

React Native (Expo) app for iOS and Android.

## Quick Start

```bash
cd mobile
npm install

# Start Expo dev server
npx expo start
```

Then:
- **iPhone (physical)** — Install [Expo Go](https://apps.apple.com/app/expo-go/id982107779) from the App Store, scan the QR code
- **iPhone Simulator** — Press `i` in the terminal (requires Xcode on Mac)
- **Android** — Press `a` (requires Android Studio emulator)

## Real Device Setup

When testing on a physical iPhone, update the backend URL in `src/services/api.ts`:

```ts
// Change this:
const BASE_URL = 'http://localhost:3001';
// To your Mac's local IP (find it in System Preferences → Network):
const BASE_URL = 'http://192.168.1.X:3001';
```

Make sure the backend is running: `cd ../backend && npm run dev`

## App Structure

```
mobile/
├── app/
│   ├── _layout.tsx          # Root layout, auth guard
│   ├── (auth)/
│   │   ├── login.tsx        # Login screen
│   │   └── register.tsx     # 3-step KYC registration
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Bottom tab navigator
│   │   ├── dashboard.tsx    # Portfolio overview
│   │   ├── markets.tsx      # Indices, movers, news
│   │   ├── trade.tsx        # Trade execution
│   │   ├── orders.tsx       # Order history
│   │   └── profile.tsx      # Settings & account
│   └── chart/
│       └── [symbol].tsx     # Chart detail screen
└── src/
    ├── constants/colors.ts  # Design tokens
    ├── services/api.ts      # Typed backend API client
    ├── store/auth.ts        # Zustand auth store (SecureStore)
    ├── utils/
    │   ├── commission.ts    # Commission calculation logic
    │   └── format.ts        # Currency/number formatters
    └── components/
        ├── StockRow.tsx     # Reusable stock list row
        ├── CommissionCard.tsx # Commission breakdown card
        └── LoadingSkeleton.tsx # Skeleton loading states
```

## Build for App Store / Play Store

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Configure your project
eas build:configure

# Build iOS (requires Apple Developer account)
eas build --platform ios

# Build Android
eas build --platform android
```

## Environment

The app connects to the same backend as the web app. No separate backend needed.

Commission logic mirrors the web exactly:
- Standard: 10–12% (11% mid)
- Member: 7–9% (8% mid)
- Private: 5–6% (5.5% mid)
