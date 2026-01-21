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
    const { issueId } = req.body;
    if (!issueId) {
      return res.status(400).json({ error: "Missing issueId" });
    }

    const issueRef = adminDb.collection("issues").doc(issueId);
    const userRef = adminDb.collection("users").doc(uid);

    await adminDb.runTransaction(async (tx) => {
      const issueSnap = await tx.get(issueRef);
      if (!issueSnap.exists) throw new Error("Issue not found");

      const issue = issueSnap.data();

      // 3️⃣ Already closed
      if (issue.status === "closed") {
        throw new Error("Issue already closed");
      }

      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) throw new Error("User not found");

      const user = userSnap.data();

      // 4️⃣ Authorization
      const isOwner = issue.createdBy === uid;
      const isCompanyAdmin =
        user.role === "company_admin" &&
        user.organizationId === issue.organizationId;

      if (!isOwner && !isCompanyAdmin) {
        throw new Error("Not authorized to close issue");
      }

      // 5️⃣ Close issue
      tx.update(issueRef, { status: "closed" });
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(403).json({ error: err.message });
  }
}
