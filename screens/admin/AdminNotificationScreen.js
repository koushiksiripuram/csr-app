import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Button,
  ActivityIndicator,
} from "react-native";
import { auth, db } from "../../services/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

export default function AdminNotificationsScreen() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;

    const subscribePending = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      const adminSnap = await getDoc(doc(db, "users", user.uid));
      if (!adminSnap.exists()) {
        setLoading(false);
        return;
      }

      const { organizationId } = adminSnap.data();
      if (!organizationId) {
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "users"),
        where("organizationId", "==", organizationId),
        where("role", "==", "company_employee"),
        where("status", "==", "pending")
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setPendingUsers(data);
        setLoading(false);
      });
    };

    subscribePending();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const approveUser = async (userId) => {
    await updateDoc(doc(db, "users", userId), {
      status: "active",
    });
  };

  const rejectUser = async (userId) => {
    await updateDoc(doc(db, "users", userId), {
      status: "rejected",
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (pendingUsers.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No pending employee requests</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pending Employee Requests</Text>

      <FlatList
        data={pendingUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text>Email: {item.email}</Text>
            <Text>Domain: {item.domain}</Text>

            <View style={styles.actions}>
              <Button title="Approve" onPress={() => approveUser(item.id)} />
              <Button
                title="Reject"
                color="red"
                onPress={() => rejectUser(item.id)}
              />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
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
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
});
