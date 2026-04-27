import React, { useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import HeaderLogoutButton from '../components/HeaderLogoutButton';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

import StudentMonitoring from '../screens/student/StudentMonitoringScreen';
import StudentRating from '../screens/student/StudentRatingScreen';
import StudentAttendance from '../screens/student/StudentAttendanceScreen';

import LecturerClasses from '../screens/lecturer/LecturerClassesScreen';
import LecturerReport from '../screens/lecturer/LecturerReportForm';
import LecturerMonitoring from '../screens/lecturer/LecturerMonitoringScreen';
import LecturerRating from '../screens/lecturer/LecturerRatingScreen';
import LecturerAttendance from '../screens/lecturer/LecturerAttendanceScreen';

import PrlCourses from '../screens/prl/PrlCoursesScreen';
import PrlReports from '../screens/prl/PrlReportsScreen';
import PrlMonitoring from '../screens/prl/PrlMonitoringScreen';
import PrlRating from '../screens/prl/PrlRatingScreen';
import PrlClasses from '../screens/prl/PrlClassesScreen';

import PlCourses from '../screens/pl/PlCourseManagement';
import PlReports from '../screens/pl/PlReportsScreen';
import PlMonitoring from '../screens/pl/PlMonitoringScreen';
import PlClasses from '../screens/pl/PlClassesScreen';
import PlLectures from '../screens/pl/PlLecturesScreen';
import PlRating from '../screens/pl/PlRatingScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function MainTabs({ role }) {

  const tabs = useMemo(() => ({
    student: [
      { name: 'Monitoring', component: StudentMonitoring },
      { name: 'Rating', component: StudentRating },
      { name: 'Attendance', component: StudentAttendance }
    ],
    lecturer: [
      { name: 'Classes', component: LecturerClasses },
      { name: 'Reports', component: LecturerReport },
      { name: 'Monitoring', component: LecturerMonitoring },
      { name: 'Rating', component: LecturerRating },
      { name: 'Attendance', component: LecturerAttendance }
    ],
    prl: [
      { name: 'Courses', component: PrlCourses },
      { name: 'Reports', component: PrlReports },
      { name: 'Monitoring', component: PrlMonitoring },
      { name: 'Rating', component: PrlRating },
      { name: 'Classes', component: PrlClasses }
    ],
    pl: [
      { name: 'Courses', component: PlCourses },
      { name: 'Reports', component: PlReports },
      { name: 'Monitoring', component: PlMonitoring },
      { name: 'Classes', component: PlClasses },
      { name: 'Lectures', component: PlLectures },
      { name: 'Rating', component: PlRating }
    ]
  }), []);

  const roleTabs = tabs[role] || tabs.student;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerRight: () => <HeaderLogoutButton />,
        headerStyle: { backgroundColor: '#fff' },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#888',

        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'help-circle-outline';

          if (route.name === 'Monitoring') iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          else if (route.name === 'Rating') iconName = focused ? 'star' : 'star-outline';
          else if (route.name === 'Attendance') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Classes') iconName = focused ? 'school' : 'school-outline';
          else if (route.name === 'Reports') iconName = focused ? 'document-text' : 'document-text-outline';
          else if (route.name === 'Courses') iconName = focused ? 'library' : 'library-outline';
          else if (route.name === 'Lectures') iconName = focused ? 'videocam' : 'videocam-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      {roleTabs.map(({ name, component }) => (
        <Tab.Screen key={name} name={name} component={component} />
      ))}
    </Tab.Navigator>
  );
}

/* ---------------- ROOT NAVIGATOR ---------------- */
export default function AppNavigator() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainTabs role={role} /> : <AuthStack />}
    </NavigationContainer>
  );
}