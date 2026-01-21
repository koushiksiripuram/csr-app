import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { ScrollView } from "react-native";
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../../services/firebase";

export default function PostIssueScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState(null);
  const [domains, setDomains] = useState([
    { label: "Web Development", value: "Web" },
    { label: "Cloud Computing", value: "Cloud" },
    { label: "AI / ML", value: "AI" },
    { label: "Data Science", value: "Data Science" },
    { label: "Cyber Security", value: "Security" },
  ]);

  const submitIssue = async () => {
    if (!title || !description || !domain) {
      alert("All fields are required");
      return;
    }

    try {
      const user = auth.currentUser;

      if (!user) {
        alert("You must be logged in");
        return;
      }

      // 🔹 Fetch logged-in user's profile
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        alert("User profile not found");
        return;
      }

      const userData = userSnap.data();

      // 🔹 Base issue payload
      const issueData = {
        title,
        description,
        domain,
        createdBy: user.uid,
        createdByName: userData.name || userData.email || "Anonymous",
        createdAt: serverTimestamp(),
        status: "open",
      };

      // 🔹 Attach organizationId ONLY if user belongs to a company
      if (userData.organizationId) {
        issueData.organizationId = userData.organizationId;
      }

      await addDoc(collection(db, "issues"), issueData);

      alert("Issue posted successfully");

      // Reset form
      setTitle("");
      setDescription("");
      setDomain(null);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Post an Issue</Text>

      <TextInput
        style={styles.input}
        placeholder="Issue Title"
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Issue Description"
        multiline
        value={description}
        onChangeText={setDescription}
      />

      <DropDownPicker
        open={open}
        value={domain}
        items={domains}
        setOpen={setOpen}
        setValue={setDomain}
        setItems={setDomains}
        placeholder="Select Domain"
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
      />

      <Button title="Submit Issue" onPress={submitIssue} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  dropdown: {
    marginBottom: 15,
  },
  dropdownContainer: {},
});
