import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import HomeScreen from "./HomeScreen";
import IssueFeedScreen from "./IssueFeedScreen";
import UserActivityScreen from "./UserActivityScreen";
import UserProfileScreen from "./UserProfileScreen";
import { Ionicons } from "@expo/vector-icons";
const Tab = createBottomTabNavigator();




export default function UserTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === "Home") iconName = "home-outline";
          else if (route.name === "Issues") iconName = "bug-outline";
          else if (route.name === "MyActivity") iconName = "stats-chart-outline";
          else if (route.name === "Profile") iconName = "person-outline";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Issues" component={IssueFeedScreen} />
    <Tab.Screen name="MyActivity" component={UserActivityScreen} />
    <Tab.Screen name="Profile" component={UserProfileScreen} />
    
    </Tab.Navigator>
  );
};