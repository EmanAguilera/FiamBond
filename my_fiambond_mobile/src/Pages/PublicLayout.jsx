import React, { useCallback } from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
// Note: In RN, useRoute gives us the current route name/params

// Placeholder for RN Logo Image
const FiamBondLogo = require('../../assets/FiamBond_Logo.png'); 

export default function PublicLayoutNative({ children }) {
    const navigation = useNavigation();
    const route = useRoute(); // Use useRoute to check the current screen
    
    // Check if the current screen is the Welcome Page
    const isLandingPage = route.name === "WelcomePage"; // Assuming 'WelcomePage' is the name for "/" or "/welcome"

    const scrollToSection = useCallback((id) => {
        // RN Scroll logic must be handled via a global event or context, 
        // as the scroll target (WelcomePage) is the child component.
        
        if (isLandingPage) {
            // Placeholder: If on the landing page, fire a global event/call a function 
            // inside the child component (WelcomePageNative) to handle the scroll ref.
            console.log(`[PublicLayout] Signaling child (WelcomePage) to scroll to: ${id}`);
        } else {
            // If not on the landing page, navigate to it, passing the section as a param
            // Note: This relies on WelcomePage listening for the 'section' parameter.
            navigation.navigate('WelcomePage', { section: id });
        }
    }, [isLandingPage, navigation]);

    return (
        <View className="flex flex-col min-h-screen font-sans bg-gray-50 text-gray-900 w-full overflow-x-hidden">
            
            {/* --- HEADER --- */}
            <View className="fixed w-full z-50 top-0 start-0 border-b border-gray-200 bg-white/80 backdrop-blur-md">
                <View className="max-w-screen-2xl flex flex-row items-center justify-between mx-auto p-4 px-6 lg:px-8 h-20">
                    
                    {/* 1. Logo (Home Link) */}
                    <TouchableOpacity 
                        onPress={() => navigation.navigate('WelcomePage')} 
                        className="flex flex-row items-center gap-2"
                    >
                         <Image source={FiamBondLogo} className="h-8 w-8" style={{ resizeMode: 'contain' }} />
                         <Text className="self-center text-xl font-bold whitespace-nowrap text-indigo-600">FiamBond</Text>
                    </TouchableOpacity>

                    {/* 2. Login/Get Started Buttons (md:order-2) */}
                    <View className="flex flex-row items-center gap-4">
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('Login')}
                            className="text-gray-900 hover:text-indigo-600 font-medium text-sm px-4 py-2"
                        >
                            <Text className="text-gray-900 font-medium text-sm">Log In</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('Register')}
                            className="text-white bg-indigo-600 hover:bg-indigo-700 font-medium rounded-lg text-sm px-4 py-2 text-center shadow-md"
                        >
                            <Text className="text-white font-medium text-sm">Get Started</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 3. Navigation Links (Features & Pricing) - Desktop Only */}
                    <View className="hidden md:flex md:w-auto md:order-1 items-center justify-between">
                        
                        {isLandingPage && (
                            <View className="flex flex-row p-4 md:p-0 mt-4 font-medium md:space-x-8 md:flex-row md:mt-0">
                              
                              <TouchableOpacity 
                                onPress={() => scrollToSection('features')} 
                                className="block py-2 px-3 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-indigo-600 md:p-0"
                              >
                                <Text className="text-gray-900 text-sm">Features</Text>
                              </TouchableOpacity>
                              
                              <TouchableOpacity 
                                onPress={() => scrollToSection('pricing')} 
                                className="block py-2 px-3 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-indigo-600 md:p-0"
                              >
                                <Text className="text-gray-900 text-sm">Pricing</Text>
                              </TouchableOpacity>
                            </View>
                        )}
                        
                    </View>
                </View>
            </View>

            {/* --- CONTENT --- */}
            <View className="flex-grow pt-20"> 
                {children}
            </View>

            {/* --- FOOTER --- */}
            <View className="bg-white py-12 border-t border-gray-200">
                <View className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <View className="flex flex-row items-center gap-3">
                        <Image source={FiamBondLogo} className="h-9 w-9" style={{ resizeMode: 'contain' }} />
                        <Text className="text-xl font-bold text-indigo-600">FiamBond</Text>
                    </View>
                    
                    <View className="text-gray-500 text-sm">
                        <Text className="text-gray-500 text-sm">
                            &copy; {new Date().getFullYear()} Eman Ryan L. Aguilera. All rights reserved.
                        </Text>
                    </View>
                    
                    <View className="flex flex-row space-x-8 text-gray-500 text-sm font-medium">
                        <TouchableOpacity onPress={() => navigation.navigate('Privacy')}>
                            <Text className="text-gray-500 text-sm font-medium">Privacy Policy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
                            <Text className="text-gray-500 text-sm font-medium">Terms of Service</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
}