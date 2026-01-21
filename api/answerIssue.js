import { adminDb, verifyFirebaseToken } from "./firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1️⃣ Verify token
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");
    const decoded = await verifyFirebaseToken(token);
    const uid = decoded.uid;

    // 2️⃣ Input
    const { issueId, text } = req.body;
    if (!issueId || !text) {
      return res.status(400).json({ error: "Missing issueId or text" });
    }

    const issueRef = adminDb.collection("issues").doc(issueId);
    const userRef = adminDb.collection("users").doc(uid);

    await adminDb.runTransaction(async (tx) => {
      const issueSnap = await tx.get(issueRef);
      if (!issueSnap.exists) throw new Error("Issue not found");

      const issue = issueSnap.data();

      // 3️⃣ Issue must be open
      if (issue.status !== "open") {
        throw new Error("Issue is closed");
      }

      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) throw new Error("User not found");

      const user = userSnap.data();

      // 4️⃣ Company admin cannot answer
      if (user.role === "company_admin") {
        throw new Error("Company admin cannot answer issues");
      }

      // 5️⃣ Create answer
      const answerRef = issueRef.collection("answers").doc();

      tx.set(answerRef, {
        text,
        createdBy: uid,
        createdAt: new Date(),
        isAccepted: false,
      });
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(403).json({ error: err.message });
  }
}
