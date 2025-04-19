# Firebase Credentials

This directory is for storing your Firebase Service Account Key for accessing Firebase services.

## Service Account Key

To use Firebase Storage, you need to add your Firebase service account key file named `serviceAccountKey.json` to this directory.

### How to get your service account key:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Open your project 
3. Navigate to Project settings > Service accounts
4. Click "Generate new private key"
5. Save the downloaded JSON file as `serviceAccountKey.json` in this directory

## Environment Variables Alternative

Alternatively, you can set the following environment variables in your `.env` file:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email@example.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

Note: The `FIREBASE_PRIVATE_KEY` should be enclosed in quotes and have `\n` for line breaks. 