// my_fiambond_mobile/App.tsx
import React, { useContext, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

// CSS Import for NativeWind
import './global.css'; 

// Context and Route Guards
import AppProvider, { AppContext } from './src/Context/AppContext';
import AdminRoute from './src/Components/Admin/AdminRoute'; 

// Import Screens
import WelcomePage from './src/Pages/Landing/WelcomePage';
import Register from './src/Pages/Auth/Register';
import Login from './src/Pages/Auth/Login';
import VerifyEmail from './src/Pages/Auth/VerifyEmail';
import Settings from './src/Pages/Settings';
import TermsOfService from './src/Pages/TermsOfService';
import PrivacyPolicy from './src/Pages/PrivacyPolicy';
import UserRealm from './src/Pages/Personal/UserRealm';
import CompanyRealm from './src/Pages/Company/CompanyRealm'; 
import FamilyRealm from './src/Pages/Family/FamilyRealm';   
import AdminRealm from './src/Pages/Admin/AdminRealm';     
import Layout from './src/Pages/layout'; 

const Stack = createNativeStackNavigator();

/**
 * HOC to wrap screens with your custom Layout.
 * Ensures Sidebar/Header is present on all Realm screens.
 */
const withLayout = (Component: React.ComponentType<any>) => (props: any) => (
    <Layout>
      <Component {...props} /> 
    </Layout>
);

// Keep splash screen visible until fonts and auth are ready
SplashScreen.preventAutoHideAsync();

// --- STACKS ---

const PublicStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={withLayout(WelcomePage)} />
        <Stack.Screen name="Login" component={withLayout(Login)} />
        <Stack.Screen name="Register" component={withLayout(Register)} />
        <Stack.Screen name="Terms" component={withLayout(TermsOfService)} />
        <Stack.Screen name="Privacy" component={withLayout(PrivacyPolicy)} />
    </Stack.Navigator>
);

const ProtectedStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Core Realm Screens */}
        <Stack.Screen name="Home" component={withLayout(UserRealm)} />
        <Stack.Screen name="CompanyRealm" component={withLayout(CompanyRealm)} />
        <Stack.Screen name="FamilyRealm" component={withLayout(FamilyRealm)} />
        <Stack.Screen name="Settings" component={withLayout(Settings)} /> 

        {/* --- GUARDED ADMIN ROUTE --- */}
        <Stack.Screen name="AdminRealm">
            {(props) => (
                <AdminRoute>
                    <Layout>
                        <AdminRealm {...props} />
                    </Layout>
                </AdminRoute>
            )}
        </Stack.Screen>
    </Stack.Navigator>
);

const UnverifiedStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="VerifyEmail" component={VerifyEmail} />
    </Stack.Navigator>
);

// --- MAIN NAVIGATOR ---

const AppNavigator = () => {
    const context = useContext(AppContext) as any;
    
    // Load System Fonts
    const [fontsLoaded, fontError] = useFonts({
        'Poppins-Light': require('./assets/fonts/Poppins-Light.ttf'),
        'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
        'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
        'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
        'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
        'Poppins-Black': require('./assets/fonts/Poppins-Black.ttf'),
    });

    const onLayoutRootView = useCallback(async () => {
        if ((fontsLoaded || fontError) && context && !context.loading) {
            await SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError, context]);

    if (context?.loading || (!fontsLoaded && !fontError)) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    /**
     * Auth Navigation Controller
     */
    const renderStack = () => {
        // 1. User not logged in
        if (!context?.user) {
            return <PublicStack />;
        }
        
        // 2. User logged in but Email NOT verified
        if (context.user && !context.user.emailVerified) {
            return <UnverifiedStack />;
        }

        // 3. User logged in and Verified
        return <ProtectedStack />;
    };

    return (
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <NavigationContainer>
                <StatusBar barStyle="dark-content" backgroundColor="white" />
                {renderStack()}
            </NavigationContainer>
        </View>
    );
};

export default function App() {
    return (
        <AppProvider>
            <AppNavigator />
        </AppProvider>
    );
}