// my_fiambond_mobile/App.tsx

import React, { ComponentType } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, Text } from 'react-native';
import AppProvider from './src/Context/AppContext';

// Import all necessary Pages and the Layout component
import UserRealm from './src/Pages/Personal/UserRealm';
import CompanyRealm from './src/Pages/Company/CompanyRealm'; 
import FamilyRealm from './src/Pages/Family/FamilyRealm';   
import AdminRealm from './src/Pages/Admin/AdminRealm';     
import WelcomePage from './src/Pages/Landing/WelcomePage';
import Register from './src/Pages/Auth/Register'; 
import Login from './src/Pages/Auth/Login'; 
import Layout from './src/Pages/layout'; 
import TermsOfService from './src/Pages/TermsOfService'; 
import PrivacyPolicy from './src/Pages/PrivacyPolicy'; 

const Stack = createNativeStackNavigator();

// Define a general props type for Stack Screen components
// This allows us to capture both navigation/route AND any other params/props
type StackScreenProps = {
    navigation: any;
    route: any;
    // Note: Other custom props (like 'company', 'onBack') would be defined here if known,
    // but for now, 'any' is used to simplify.
};

// Workaround to bypass TS errors when spreading props to components that don't
// explicitly define navigation/route props. The casting to ComponentType<StackScreenProps>
// tells TS to treat the imported component as accepting all the props we are about to spread.
const ComponentCaster = (Component: any) => (props: StackScreenProps) => (
    <Layout currentRouteName={props.route.name} navigation={props.navigation}>
      {/* Explicitly spread all props to the inner component */}
      <Component {...props} /> 
    </Layout>
);

// --- Use the Caster function for cleaner code and correct type handling ---

const WelcomePageWithLayout = ComponentCaster(WelcomePage);
const RegisterPageWithLayout = ComponentCaster(Register);
const LoginPageWithLayout = ComponentCaster(Login);
const UserRealmPageWithLayout = ComponentCaster(UserRealm);
const CompanyRealmPageWithLayout = ComponentCaster(CompanyRealm);
const FamilyRealmPageWithLayout = ComponentCaster(FamilyRealm);
const AdminRealmPageWithLayout = ComponentCaster(AdminRealm); // NOTE: Missing props error (onBack, etc.) is suppressed by 'any' but still a runtime risk.
const TermsOfServicePageWithLayout = ComponentCaster(TermsOfService);
const PrivacyPolicyPageWithLayout = ComponentCaster(PrivacyPolicy);


export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" />
        <Stack.Navigator
          // Set WelcomePage as the initial screen
          initialRouteName="WelcomePage"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#4f46e5',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          {/* 1. WelcomePage screen */}
          <Stack.Screen
            name="WelcomePage"
            component={WelcomePageWithLayout}
            options={{ 
              headerShown: false
            }}
          />
          
          {/* 2. UserRealm screen */}
          <Stack.Screen
            name="UserRealm"
            component={UserRealmPageWithLayout} 
            options={{
              headerShown: false
            }}
          />

          {/* 3. CompanyRealm screen */}
          <Stack.Screen
            name="CompanyRealm"
            component={CompanyRealmPageWithLayout} 
            options={{
              headerShown: false
            }}
          />

          {/* 4. FamilyRealm screen */}
          <Stack.Screen
            name="FamilyRealm"
            component={FamilyRealmPageWithLayout} 
            options={{
              headerShown: false
            }}
          />

          {/* 5. AdminRealm screen */}
          <Stack.Screen
            name="AdminRealm"
            component={AdminRealmPageWithLayout} 
            options={{
              headerShown: false
            }}
          />
          
          {/* 6. Register screen */}
          <Stack.Screen
            name="Register"
            component={RegisterPageWithLayout}
            options={{ 
              headerShown: false
            }}
          />

          {/* 7. Login screen */}
          <Stack.Screen
            name="Login"
            component={LoginPageWithLayout}
            options={{ 
              headerShown: false
            }}
          />

          {/* 8. TermsOfService screen */}
          <Stack.Screen
            name="Terms"
            component={TermsOfServicePageWithLayout}
            options={{ 
              headerShown: false
            }}
          />

          {/* 9. PrivacyPolicy screen */}
          <Stack.Screen
            name="Privacy"
            component={PrivacyPolicyPageWithLayout}
            options={{ 
              headerShown: false
            }}
          />
          
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}