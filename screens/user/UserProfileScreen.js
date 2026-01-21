import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import { auth, db } from "../../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
export default function UserProfileScreen() {
  const [userData, setUserData] = useState(null);

 useEffect(() => {
  const user = auth.currentUser;
  if (!user) return;

  const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
    if (snap.exists()) {
      setUserData(snap.data());
    }
  });

  return () => unsub();
}, []);

  if (!userData) {
    return (
      <View style={styles.center}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>My Profile</Text>

      {/* Profile Card */}
      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{userData.name}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{userData.email}</Text>

        <Text style={styles.label}>Role</Text>
        <Text style={styles.value}>{userData.role}</Text>
        <Text style={styles.points}>
          ⭐ Points: {userData.points ?? 0}
        </Text>

        {userData.domain && (
          <>
            <Text style={styles.label}>Domain</Text>
            <Text style={styles.value}>{userData.domain}</Text>
          </>
        )}
      </View>

      {/* Logout */}
      <View style={styles.logout}>
        <Button title="Logout" color="red" onPress={() => signOut(auth)} />
      </View>
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
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 16,
  },
  label: {
    fontSize: 12,
    color: "#666",
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    fontWeight: "500",
  },
 points: {
  marginTop: 12,
  fontSize: 18,
  fontWeight: "bold",
  color: "#2563eb",
  textAlign: "center",
},

  logout: {
    marginTop: 30,
    alignSelf: "center",
    width: "80%",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#ffebee",
  },
});
