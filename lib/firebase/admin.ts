"use server";

import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK only once
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
