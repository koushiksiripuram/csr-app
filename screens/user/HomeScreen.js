import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>Welcome to CSR Connect</Text>
      <Text style={styles.subtitle}>
        Contribute to open-source problems, help others, and grow together.
      </Text>

      {/* Action Cards */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Explore Issues</Text>
        <Text style={styles.cardText}>
          Browse open issues posted by the community and companies.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate("Issues")}
        >
          <Text style={styles.buttonText}>View Issues</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Post a New Issue</Text>
        <Text style={styles.cardText}>
          Have a question or problem? Post it and get help.
        </Text>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("PostIssue")}
        >
          <Text style={styles.buttonText}>Post Issue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 20,
  },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 16,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  cardText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: "#16a34a",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
