import { adminDb, verifyFirebaseToken } from "./firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1️⃣ Get & verify token
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");
    const decoded = await verifyFirebaseToken(token);
    const uid = decoded.uid;

    // 2️⃣ Read input
    const { issueId, answerId } = req.body;
    if (!issueId || !answerId) {
      return res.status(400).json({ error: "Missing issueId or answerId" });
    }

    // 3️⃣ References
    const issueRef = adminDb.collection("issues").doc(issueId);
    const answerRef = issueRef.collection("answers").doc(answerId);

    await adminDb.runTransaction(async (tx) => {
      const issueSnap = await tx.get(issueRef);
      if (!issueSnap.exists) throw new Error("Issue not found");

      const issue = issueSnap.data();

      // 4️⃣ Issue must be open
      if (issue.status !== "open") {
        throw new Error("Issue is closed");
      }

      // 5️⃣ Only issue owner can accept
      if (issue.createdBy !== uid) {
        throw new Error("Not authorized");
      }

      const answerSnap = await tx.get(answerRef);
      if (!answerSnap.exists) throw new Error("Answer not found");

      const answer = answerSnap.data();

      // 6️⃣ Prevent double acceptance
      if (answer.isAccepted === true) {
        throw new Error("Answer already accepted");
      }

      const userRef = adminDb.collection("users").doc(answer.createdBy);

      // 7️⃣ Updates
      tx.update(answerRef, { isAccepted: true });
      tx.update(userRef, {
        points: adminDb.FieldValue.increment(10),
        answersCount: adminDb.FieldValue.increment(1),
      });
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(403).json({ error: err.message });
  }
}
