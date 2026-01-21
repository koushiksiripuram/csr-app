import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Button,
  ActivityIndicator,
} from "react-native";
import {
  collection as firestoreCollection,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { auth, db } from "../../services/firebase";

export default function IssueDetailScreen({ route }) {
  const { issue, issueId } = route.params;

  const [currentIssue, setCurrentIssue] = useState(issue || null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState([]);
  const [newAnswer, setNewAnswer] = useState("");
  const [userNames, setUserNames] = useState({});

  /* ---------- LOAD ISSUE ---------- */
  useEffect(() => {
    if (!currentIssue && issueId) {
      const loadIssue = async () => {
        const snap = await getDoc(doc(db, "issues", issueId));
        if (snap.exists()) {
          setCurrentIssue({ id: snap.id, ...snap.data() });
        }
        setLoading(false);
      };
      loadIssue();
    } else {
      setLoading(false);
    }
  }, [issueId]);

  /* ---------- READ ANSWERS ---------- */
  useEffect(() => {
    if (!currentIssue) return;

    const q = query(
      firestoreCollection(db, "issues", currentIssue.id, "answers"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAnswers(data);
    });

    return () => unsubscribe();
  }, [currentIssue]);

  /* ---------- FETCH USER NAMES ---------- */
  useEffect(() => {
    const fetchNames = async () => {
      for (const ans of answers) {
        const uid = ans.createdBy;
        if (!uid || userNames[uid]) continue;

        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
          setUserNames((prev) => ({
            ...prev,
            [uid]: snap.data().name,
          }));
        }
      }
    };

    fetchNames();
  }, [answers]);

  /* ---------- SUBMIT ANSWER ---------- */
  const submitAnswer = async () => {
    if (!newAnswer.trim()) {
      alert("Answer cannot be empty");
      return;
    }

    const user = auth.currentUser;
    if (!user || !currentIssue) return;

    try {
      await addDoc(
        firestoreCollection(db, "issues", currentIssue.id, "answers"),
        {
          text: newAnswer.trim(),
          createdBy: user.uid,
          isAccepted: false, // ✅ CHANGED
          createdAt: serverTimestamp(),
        }
      );
      setNewAnswer("");
      alert("Answer submitted");
    } catch (err) {
      alert("Something went wrong");
    }
  };

  /* ---------- ACCEPT ANSWER ---------- */
  const acceptAnswer = async (ans) => {
    const user = auth.currentUser;
    if (!user) return;

    const isOwner = user.uid === currentIssue.createdBy;
    if (!isOwner) {
      alert("Only issue owner can accept answers");
      return;
    }

    if (ans.isAccepted) return;

    try {
      await updateDoc(
        doc(db, "issues", currentIssue.id, "answers", ans.id),
        { isAccepted: true } // ✅ CHANGED
      );

      await updateDoc(doc(db, "users", ans.createdBy), {
        points: increment(10),
        answersCount: increment(1),
      });

      alert("Answer accepted. CSR points awarded.");
    } catch (err) {
      console.error(err);
      alert("Failed to accept answer");
    }
  };
  const closeIssue = async () => {
  const user = auth.currentUser;
  if (!user || !currentIssue) return;

  try {
    const userSnap = await getDoc(doc(db, "users", user.uid));
    if (!userSnap.exists()) return;

    const userData = userSnap.data();

    const isOwner = user.uid === currentIssue.createdBy;
    const isCompanyAdmin =
      userData.role === "company_admin" &&
      userData.organizationId === currentIssue.organizationId;

    if (!isOwner && !isCompanyAdmin) {
      alert("You are not authorized to close this issue");
      return;
    }

    await updateDoc(doc(db, "issues", currentIssue.id), {
      status: "closed",
    });

    alert("Issue closed successfully");
  } catch (err) {
    console.error(err);
    alert("Failed to close issue");
  }
};

  /* ---------- RENDER ---------- */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!currentIssue) {
    return (
      <View style={styles.center}>
        <Text>Issue not found</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.issueTitle}>{currentIssue.title}</Text>

      <Text style={styles.label}>Domain</Text>
      <Text>{currentIssue.domain}</Text>

      <Text style={styles.label}>Description</Text>
      <Text>{currentIssue.description}</Text>
      {currentIssue.status === "open" && (
  <Button title="Close Issue" onPress={closeIssue} />
)}

      <Text style={styles.sectionTitle}>Answers</Text>

      {answers.length === 0 ? (
        <Text>No answers yet</Text>
      ) : (
        answers.map((ans) => {
          const isOwner = auth.currentUser?.uid === currentIssue.createdBy;

          return (
            <View key={ans.id} style={styles.answerCard}>
              <Text>{ans.text}</Text>

              <Text style={styles.meta}>
                Answered by: {userNames[ans.createdBy] || "Unknown"}
              </Text>

              {ans.isAccepted && (
                <Text style={styles.meta}>✅ Accepted</Text>
              )}

              {isOwner && !ans.isAccepted && (
                <Button
                  title="Accept Answer"
                  onPress={() => acceptAnswer(ans)}
                />
              )}
            </View>
          );
        })
      )}

      

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  issueTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  label: { marginTop: 10, fontWeight: "bold" },
  sectionTitle: { marginTop: 25, fontSize: 18, fontWeight: "bold" },
  answerCard: { borderWidth: 1, borderRadius: 6, padding: 10, marginTop: 10 },
  meta: { fontSize: 12, color: "gray", marginTop: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
    minHeight: 80,
    textAlignVertical: "top",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
