import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
};

const isBrowser = typeof window !== "undefined";

const ensureFirebaseApp = (): FirebaseApp | null => {
    if (!isBrowser) {
        return null;
    }

    if (!firebaseConfig.apiKey || !firebaseConfig.authDomain) {
        console.warn("Firebase config is missing. Did you set NEXT_PUBLIC_FIREBASE_* env vars?");
        return null;
    }

    return getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
};

export const getFirebaseAuth = (): Auth | null => {
    const app = ensureFirebaseApp();
    return app ? getAuth(app) : null;
};

export const getGoogleProvider = (): GoogleAuthProvider | null => {
    if (!isBrowser) {
        return null;
    }

    return new GoogleAuthProvider();
};
