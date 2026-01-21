import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../services/firebase";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // 🔥 Fetch user profile ONCE
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (!userSnap.exists()) {
        alert("User profile not found");
        return;
      }

      const userData = userSnap.data();

      /* ---------- EMPLOYEE STATUS CHECK ---------- */
      if (userData.role === "company_employee") {
        if (userData.status === "pending") {
          alert("Your account is pending approval.");
          await auth.signOut();
          return;
        }

        if (userData.status === "rejected") {
          alert("Your account request was rejected.");
          await auth.signOut();
          return;
        }
      }

      /* ---------- STORE USER DATA GLOBALLY ---------- */
      global.currentUser = {
  uid: user.uid,
  role: userData.role,
  organizationId: userData.organizationId || null,
};

      /* ---------- NAVIGATION ---------- */
      
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CSR App Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button title="Login" onPress={login} />

      <Text style={styles.link} onPress={() => navigation.navigate("Signup")}>
        Don't have an account? Signup
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 28, marginBottom: 20, fontWeight: "bold" },
  input: {
    width: "80%",
    padding: 10,
    margin: 10,
    borderWidth: 1,
    borderRadius: 5,
  },
  link: { marginTop: 20, color: "blue" },
});
