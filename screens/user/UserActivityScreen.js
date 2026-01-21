import React, { useEffect, useState } from "react";
import { TouchableOpacity } from "react-native";

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { auth, db } from "../../services/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";

export default function MyActivityScreen({navigation}) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMyActivity = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const issuesSnap = await getDocs(collection(db, "issues"));
        let results = [];

        for (const issueDoc of issuesSnap.docs) {
          const issueData = issueDoc.data();

          const answersSnap = await getDocs(
            query(
              collection(db, "issues", issueDoc.id, "answers"),
              orderBy("createdAt", "desc")
            )
          );

          answersSnap.forEach((answerDoc) => {
            const answer = answerDoc.data();

            if (answer.createdBy === user.uid) {
              results.push({
                id: answerDoc.id,
                issueId: issueDoc.id,
                issueTitle: issueData.title,
                text: answer.text,
                createdAt: answer.createdAt,
              });
            }
          });
        }

        setActivities(results);
        setLoading(false);
      } catch (err) {
        console.log("My Activity error:", err);
        setLoading(false);
      }
    };

    loadMyActivity();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (activities.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No activity yet</Text>
        <Text style={styles.emptyText}>
          Answer issues to see your contributions here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Activity</Text>

      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}
  onPress={() =>
    navigation.navigate("IssueDetailOwn", {
      issueId: item.issueId,
    })
  }>
            <Text style={styles.issueTitle}>{item.issueTitle}</Text>
            <Text style={styles.answerText}>{item.text}</Text>
            {item.createdAt && (
              <Text style={styles.date}>
                {new Date(item.createdAt.seconds * 1000).toLocaleString()}
              </Text>
            )}
          </TouchableOpacity>
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
    padding: 20,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  answerText: {
    marginTop: 6,
    fontSize: 14,
  },
  date: {
    marginTop: 6,
    fontSize: 12,
    color: "gray",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  emptyText: {
    marginTop: 6,
    color: "gray",
    textAlign: "center",
  },
});
