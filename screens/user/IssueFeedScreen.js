import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../../services/firebase";

export default function IssueFeedScreen({ navigation }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userNames, setUserNames] = useState({}); // 🔹 cache userId → name

  // 🔹 fetch user name once and cache it
  const fetchUserName = async (uid) => {
    if (userNames[uid]) return;

    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      setUserNames((prev) => ({
        ...prev,
        [uid]: snap.data().name,
      }));
    }
  };

  useEffect(() => {
    let unsubscribers = [];

    const loadIssues = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (!userSnap.exists()) return;

      const userData = userSnap.data();
      const role = userData.role;
      const userDomain = userData.domain;
      const orgId = userData.organizationId;

      // 🌍 GENERAL USER → all issues
      if (role === "general") {
        const q = query(
          collection(db, "issues"),
          orderBy("createdAt", "desc")
        );

        const unsub = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setIssues(data);
          data.forEach((issue) => {
            if (issue.createdBy) fetchUserName(issue.createdBy);
          });
          setLoading(false);
        });

        unsubscribers.push(unsub);
      }

      // 🧑‍💼 COMPANY ADMIN → company issues only
      else if (role === "company_admin") {
        const q = query(
          collection(db, "issues"),
          where("organizationId", "==", orgId),
          orderBy("createdAt", "desc")
        );

        const unsub = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setIssues(data);
          data.forEach((issue) => {
            if (issue.createdBy) fetchUserName(issue.createdBy);
          });
          setLoading(false);
        });

        unsubscribers.push(unsub);
      }

      // 👨‍💼 COMPANY EMPLOYEE → company issues + domain issues
      else if (role === "company_employee") {
        let resultsMap = {};

        // Company issues
        if (orgId) {
          const companyQuery = query(
            collection(db, "issues"),
            where("organizationId", "==", orgId)
          );

          const unsubCompany = onSnapshot(companyQuery, (snapshot) => {
            snapshot.forEach((doc) => {
              resultsMap[doc.id] = { id: doc.id, ...doc.data() };
            });

            const merged = Object.values(resultsMap);
            setIssues(merged);
            merged.forEach((issue) => {
              if (issue.createdBy) fetchUserName(issue.createdBy);
            });
            setLoading(false);
          });

          unsubscribers.push(unsubCompany);
        }

        // Domain issues (global)
        if (userDomain) {
          const domainQuery = query(
            collection(db, "issues"),
            where("domain", "==", userDomain)
          );

          const unsubDomain = onSnapshot(domainQuery, (snapshot) => {
            snapshot.forEach((doc) => {
              resultsMap[doc.id] = { id: doc.id, ...doc.data() };
            });

            const merged = Object.values(resultsMap);
            setIssues(merged);
            merged.forEach((issue) => {
              if (issue.createdBy) fetchUserName(issue.createdBy);
            });
            setLoading(false);
          });

          unsubscribers.push(unsubDomain);
        }
      }
    };

    loadIssues();

    return () => {
      unsubscribers.forEach((unsub) => unsub && unsub());
    };
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("IssueDetail", { issue: item })}
    >
      <Text style={styles.title}>{item.title}</Text>

      <Text style={styles.meta}>
        Posted by: {item.createdByName||userNames[item.createdBy] || "Loading..."}
      </Text>

      <Text style={styles.meta}>Domain: {item.domain}</Text>

      {item.organizationId && (
        <Text style={styles.meta}>Company Issue</Text>
      )}

      <Text style={styles.meta}>Status: {item.status}</Text>
    </TouchableOpacity>
  );

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
        <Text style={styles.emptyTitle}>No issues yet 💤</Text>
        <Text style={styles.emptyText}>
          Be the first to post or check back later.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Issues</Text>
      <FlatList
        data={issues}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  card: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  meta: {
    fontSize: 13,
    color: "gray",
    marginTop: 3,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
  },
});
