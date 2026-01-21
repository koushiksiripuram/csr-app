import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { auth, db } from "../../services/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";

export default function AdminContributionsScreen({ navigation }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;

    const loadContributions = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const adminSnap = await getDoc(doc(db, "users", user.uid));
        if (!adminSnap.exists()) return;

        const { organizationId } = adminSnap.data();
        if (!organizationId) return;

        const q = query(
          collection(db, "issues"),
          where("organizationId", "==", organizationId),
          orderBy("createdAt", "desc")
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setIssues(data);
          setLoading(false);
        });
      } catch (err) {
        console.log("Admin contributions error:", err);
        setLoading(false);
      }
    };

    loadContributions();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (issues.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No contributions found for this company</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Company Contributions</Text>

      <FlatList
        data={issues}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate("IssueDetail", { issue: item })
            }
          >
            <Text style={styles.issueTitle}>{item.title}</Text>
            <Text>Domain: {item.domain}</Text>
            <Text>Status: {item.status}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  card: { borderWidth: 1, borderRadius: 6, padding: 12, marginBottom: 10 },
  issueTitle: { fontSize: 16, fontWeight: "bold" },
});
