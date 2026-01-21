import admin from "firebase-admin";

/**
 * Prevent re-initialization on hot reloads / serverless reuse
 */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

// 🔥 Full-access Firestore (Admin)
const adminDb = admin.firestore();

// 🔐 Token verifier (used by all APIs)
const verifyFirebaseToken = async (token) => {
  if (!token) {
    throw new Error("Missing authorization token");
  }

  const decodedToken = await admin.auth().verifyIdToken(token);
  return decodedToken; // { uid, email, ... }
};

export { adminDb, verifyFirebaseToken };
