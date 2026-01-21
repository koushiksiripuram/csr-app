import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { auth, db } from "./services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Auth screens
import LoginScreen from "./screens/auth/LoginScreen";
import SignupScreen from "./screens/auth/SignupScreen";

// User screens
import UserTabs from "./screens/user/UserTabs";


// Admin screen
import AdminTabs from "./screens/admin/AdminTabs";
import PostIssueScreen from "./screens/user/PostIssueScreen";
import IssueDetailScreen from "./screens/user/IssueDetailScreen";
import IssueDetailOwnScreen from "./screens/user/IssueDetailOwnScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("general"); // valid default
  const [loading, setLoading] = useState(true);

  // 🔹 Bootstrap auth + role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      try {
        if (!u) {
          setUser(null);
          setRole("general");
          setLoading(false);
          return;
        }

        setUser(u);

        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) {
          const data = snap.data();
          setRole(data.role || "general");
        } else {
          setRole("general");
        }

        setLoading(false);
      } catch (err) {
        console.log("Auth init error:", err);
        setUser(null);
        setRole("general");
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // 🔹 Global loader (prevents blank screen)
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* NOT LOGGED IN */}
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : role === "company_admin" ? (
          /* COMPANY ADMIN */
          <>
          <Stack.Screen
            name="AdminTabs"
            component={AdminTabs}
          />
          <Stack.Screen name="IssueDetail" component={IssueDetailScreen}/>
          </>
        ) : (
          /* GENERAL / EMPLOYEE USER */
          <>
            <Stack.Screen name="UserTabs" component={UserTabs} />
            <Stack.Screen name="PostIssue" component={PostIssueScreen} />
            <Stack.Screen name="IssueDetail" component={IssueDetailScreen}/>
            <Stack.Screen name="IssueDetailOwn" component={IssueDetailOwnScreen}/>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
