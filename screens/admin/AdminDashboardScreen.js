import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { auth, db } from "../../services/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";

export default function AdminDashboardScreen() {
  const [stats, setStats] = useState({
    totalContributions: 0,
    pendingApprovals: 0,
    employees: 0,
    totalCsrPoints: 0,
    totalAnswers: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const adminSnap = await getDoc(doc(db, "users", user.uid));
        if (!adminSnap.exists()) return;

        const { organizationId } = adminSnap.data();
        if (!organizationId) return;

        // Contributions
        const contribSnap = await getDocs(
          query(
            collection(db, "issues"),
            where("organizationId", "==", organizationId)
          )
        );

        // Active employees
        const activeEmployeesSnap = await getDocs(
          query(
            collection(db, "users"),
            where("organizationId", "==", organizationId),
            where("role", "==", "company_employee"),
            where("status", "==", "active")
          )
        );

        // Pending employees
        const pendingEmployeesSnap = await getDocs(
          query(
            collection(db, "users"),
            where("organizationId", "==", organizationId),
            where("role", "==", "company_employee"),
            where("status", "==", "pending")
          )
        );

        // CSR aggregation
        let totalPoints = 0;
        let totalAnswers = 0;

        activeEmployeesSnap.forEach((doc) => {
          const data = doc.data();
          totalPoints += data.points || 0;
          totalAnswers += data.answersCount || 0;
        });

        setStats({
          totalContributions: contribSnap.size,
          pendingApprovals: pendingEmployeesSnap.size,
          employees: activeEmployeesSnap.size,
          totalCsrPoints: totalPoints,
          totalAnswers: totalAnswers,
        });

        setLoading(false);
      } catch (err) {
        console.log("Admin dashboard error:", err);
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);
const handleLogout = () => {
  console.log("logout button pressed by company_admin");
  signOut(auth);
};

 
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Company Admin Dashboard</Text>

      <View style={styles.card}>
        <Text>Total Contributions</Text>
        <Text style={styles.value}>{stats.totalContributions}</Text>
      </View>

      <View style={styles.card}>
        <Text>Pending Approvals</Text>
        <Text style={styles.value}>{stats.pendingApprovals}</Text>
      </View>

      <View style={styles.card}>
        <Text>Employees</Text>
        <Text style={styles.value}>{stats.employees}</Text>
      </View>

      <View style={styles.card}>
        <Text>Total CSR Points</Text>
        <Text style={styles.value}>{stats.totalCsrPoints}</Text>
      </View>

      <View style={styles.card}>
        <Text>Total Answers</Text>
        <Text style={styles.value}>{stats.totalAnswers}</Text>
      </View>

      <View style={styles.logoutContainer}>
        <Text style={styles.logoutText} onPress={handleLogout}>
          Logout
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
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
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#f2f2f2",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  value: {
    fontSize: 20,
    fontWeight: "bold",
  },
  logoutContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#ff4444",
    borderRadius: 5,
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
