
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import AdminDashboardScreen from "./AdminDashboardScreen";
import AdminContributionScreen from "./AdminContributionScreen";
import AdminEmployeesScreen from "./AdminEmployeeScreen";
import AdminNotificationScreen from "./AdminNotificationScreen";


const Tab = createBottomTabNavigator();

export default function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      
      <Tab.Screen
        name="Contributions"
        component={AdminContributionScreen}
      />
      <Tab.Screen
        name="Employees"
        component={AdminEmployeesScreen}
      />
      <Tab.Screen
        name="Notifications"
        component={AdminNotificationScreen}
      />
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
      />
    </Tab.Navigator>
  );
}
