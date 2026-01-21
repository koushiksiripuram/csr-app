import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from "../../services/firebase";

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [role, setRole] = useState("general");
  const [domain, setDomain] = useState("");
  const [organizationId, setOrganizationId] = useState("");

  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loading, setLoading] = useState(false);

  // 🔹 Load companies (admin-created only)
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const snap = await getDocs(collection(db, "organizations"));
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setCompanies(list);
      } catch (err) {
        console.log("Company load error:", err);
      } finally {
        setLoadingCompanies(false);
      }
    };

    loadCompanies();
  }, []);

  // 🔹 Clear company when role switches to general
  useEffect(() => {
    if (role === "general") {
      setOrganizationId("");
    }
  }, [role]);

  const signup = async () => {
    // 🛑 Validation
    if (!name || !email || !password || !domain) {
      alert("Please fill all required fields");
      return;
    }

    if (role === "company_employee" && !organizationId) {
      alert("Please select your company");
      return;
    }

    try {
      setLoading(true);

      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const uid = userCred.user.uid;

      // 🔹 User document
      await setDoc(doc(db, "users", uid), {
        name,
        email,
        role,
        domain,
        organizationId: role === "company_employee" ? organizationId : null,
        points: 0,
        createdAt: new Date(),
        status: "pending",
      });

      // 🔑 DO NOT navigate to Home
      navigation.replace("Login");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingCompanies) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* ROLE */}
      <Text style={styles.label}>Role</Text>
      <Picker selectedValue={role} onValueChange={setRole}>
        <Picker.Item label="General User" value="general" />
        <Picker.Item label="Company Employee" value="company_employee" />
      </Picker>

      {/* DOMAIN (single) */}
      <Text style={styles.label}>Domain</Text>
      <Picker selectedValue={domain} onValueChange={setDomain}>
        <Picker.Item label="Select domain" value="" />
        <Picker.Item label="Cloud" value="Cloud" />
        <Picker.Item label="Web" value="Web" />
        <Picker.Item label="AI / ML" value="AI" />
        <Picker.Item label="Data" value="Data" />
        <Picker.Item label="Security" value="Security" />
      </Picker>

      {/* COMPANY (only for employees) */}
      {role === "company_employee" && (
        <>
          <Text style={styles.label}>Company</Text>
          <Picker
            selectedValue={organizationId}
            onValueChange={setOrganizationId}
          >
            <Picker.Item label="Select company" value="" />
            {companies.map((c) => (
              <Picker.Item key={c.id} label={c.name} value={c.id} />
            ))}
          </Picker>
        </>
      )}

      <Button
        title={loading ? "Creating Account..." : "Signup"}
        onPress={signup}
        disabled={loading}
      />

      <Text
        style={styles.link}
        onPress={() => navigation.replace("Login")}
      >
        Already have an account? Login
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  label: {
    marginTop: 10,
    fontWeight: "bold",
  },
  link: {
    marginTop: 15,
    textAlign: "center",
    color: "blue",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
