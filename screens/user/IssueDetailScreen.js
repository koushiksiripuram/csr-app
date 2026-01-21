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
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../../services/firebase";

const API_BASE_URL = "https://YOUR_PROJECT_NAME.vercel.app/api";

export default function IssueDetailScreen({ route }) {
  const { issue, issueId } = route.params;

  const [currentIssue, setCurrentIssue] = useState(issue || null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState([]);
  const [newAnswer, setNewAnswer] = useState("");
  const [userNames, setUserNames] = useState({});
  const [userRole, setUserRole] = useState(null);

  /* ---------- LOAD USER ROLE ---------- */
  useEffect(() => {
    const loadUser = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) setUserRole(snap.data().role);
    };
    loadUser();
  }, []);

  /* ---------- LOAD ISSUE ---------- */
  useEffect(() => {
    const id = issueId || issue?.id;
    if (!id) return;

    const unsub = onSnapshot(doc(db, "issues", id), (snap) => {
      if (snap.exists()) {
        setCurrentIssue({ id: snap.id, ...snap.data() });
        setLoading(false);
      }
    });

    return () => unsub();
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

  /* ---------- SUBMIT ANSWER (API) ---------- */
  const submitAnswer = async () => {
    if (!newAnswer.trim()) {
      alert("Answer cannot be empty");
      return;
    }

    try {
      const token = await auth.currentUser.getIdToken();

      const res = await fetch(`${API_BASE_URL}/answerIssue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          issueId: currentIssue.id,
          text: newAnswer.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNewAnswer("");
      alert("Answer submitted");
    } catch (err) {
      alert(err.message || "Failed to submit answer");
    }
  };

  /* ---------- ACCEPT ANSWER (API) ---------- */
  const acceptAnswer = async (ans) => {
    try {
      const token = await auth.currentUser.getIdToken();

      const res = await fetch(`${API_BASE_URL}/acceptAnswer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          issueId: currentIssue.id,
          answerId: ans.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert("Answer accepted. CSR points awarded.");
    } catch (err) {
      alert(err.message || "Failed to accept answer");
    }
  };

  /* ---------- CLOSE ISSUE (API) ---------- */
  const closeIssue = async () => {
    try {
      const token = await auth.currentUser.getIdToken();

      const res = await fetch(`${API_BASE_URL}/closeIssue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          issueId: currentIssue.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert("Issue closed successfully");
    } catch (err) {
      alert(err.message || "Failed to close issue");
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

      {currentIssue.status === "open" ? (
        <>
          <Text style={styles.sectionTitle}>Your Answer</Text>
          <TextInput
            style={styles.input}
            multiline
            value={newAnswer}
            onChangeText={setNewAnswer}
            placeholder="Write your answer..."
          />
          <Button title="Submit Answer" onPress={submitAnswer} />
        </>
      ) : (
        <Text style={styles.meta}>
          🔒 This issue is closed. No more answers allowed.
        </Text>
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
