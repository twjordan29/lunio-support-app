# Android Push Notifications Setup with Firebase/FCM

This guide explains how to configure Firebase Cloud Messaging (FCM) for push notifications in the Lunio Support App on Android.

## Prerequisites

- Firebase account and Google Cloud project
- EAS CLI installed (`npm install -g @expo/cli eas-cli`)

## Step 1: Create Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select an existing project
3. Note the Project ID (used later)

## Step 2: Add Android App to Firebase

1. In the Firebase Console, click the gear icon → "Project settings"
2. Go to the "General" tab
3. Scroll to "Your apps" section
4. Click "Add app" → Android icon
5. Enter the package name: `com.twjordan29.luniosupportapp`
6. Enter an app nickname (optional)
7. Click "Register app"

## Step 3: Download google-services.json

1. After registering the app, click "Download google-services.json"
2. Save the file to the project root (`lunio-support-app/google-services.json`)
3. The file is safe to commit as it contains public configuration

## Step 4: Configure FCM Service Account in EAS

1. In Firebase Console → Project settings → "Service accounts" tab
2. Click "Generate new private key"
3. Download the JSON file (this contains private keys - DO NOT commit this file)
4. Run EAS credentials setup:

```bash
eas credentials
```

5. Select Android
6. Select "Push Notifications" when prompted
7. Upload the service account JSON file you downloaded

## Step 5: Rebuild Development Client

After adding credentials and google-services.json:

```bash
eas build --platform android --profile development
```

Install the updated APK on your device.

## Troubleshooting

- **"Default FirebaseApp is not initialized"**: Ensure google-services.json is present and FCM service account is configured in EAS
- **Push token retrieval fails**: Check that the development build includes the FCM credentials
- **Settings shows "Firebase/FCM config required"**: Follow steps 3-5 above

## Security Notes

- `google-services.json` is safe to commit (public config)
- FCM service account JSON files must NEVER be committed
- Service account keys are stored securely in EAS