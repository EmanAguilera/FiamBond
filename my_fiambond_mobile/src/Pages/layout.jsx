import React, { useContext, useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Modal,
    Dimensions,
    ScrollView,
    TouchableWithoutFeedback,
} from 'react-native';
// Replace web heroicons with an RN vector icon library (e.g., Ionicons)
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, CommonActions } from "@react-navigation/native";

// Assume AppContext is correctly set up for React Native
import { AppContext } from '../Context/AppContext';

// --- Icon Mapping (Ionicons used as an example) ---
const Icon = ({ name, size = 24, color = 'currentColor', style }) => {
    // Mapping the original HeroIcon names to Ionicons equivalents
    const iconMap = {
        'ArrowLeftOnRectangleIcon': 'log-out-outline',
        'Cog6ToothIcon': 'settings-outline',
        'Bars3Icon': 'menu-outline',
        'XMarkIcon': 'close-outline',
        'ChevronDownIcon': 'chevron-down-outline',
        'ClockIcon': 'time-outline',
        'CheckBadgeIcon': 'checkmark-circle-outline',
    };
    const iconName = iconMap[name] || name;
    return <Ionicons name={iconName} size={size} color={color} style={style} />;
};

// Placeholder for RN Logo Image (adjust path as necessary)
const FiamBondLogo = require('../../assets/FiamBond_Logo.png'); // Adjusted path based on typical structure

// Replace web-specific navigation with RN structure.
export default function LayoutNative({ children, currentRouteName, navigation }) {
    const { user, handleLogout, premiumDetails } = useContext(AppContext);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    
    // Note: React Native does not use dropdownRef for click outside detection. 
    // This is handled by Modal and TouchableWithoutFeedback.

    // Abstracted web path logic:
    // RN screen names (currentRouteName) replace web paths (location.pathname)
    const publicLayoutNames = ['WelcomePage', 'Login', 'Register', 'Terms', 'Privacy'];
    const isPublicLayout = !user && publicLayoutNames.includes(currentRouteName);
    const isLandingPage = currentRouteName === 'WelcomePage';
    
    // Close dropdown when navigation state changes or component is unmounted (cleanup is implicit with Modal)

    const getPageTitle = () => {
        if (currentRouteName === 'Login') return "Log In";
        if (currentRouteName === 'Register') return "Get Started";
        if (currentRouteName === 'Terms') return "Terms";
        if (currentRouteName === 'Privacy') return "Privacy";
        return "Welcome"; 
    };

    // Helper function to format subscription dates
    const formatSubscriptionDate = useCallback((dateVal) => {
        if (!dateVal) return 'Not active';
        
        const dateInMs = dateVal.seconds ? dateVal.seconds * 1000 : dateVal;
        
        const date = new Date(dateInMs);
        return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
    }, []);

    // Helper function to format expiration dates
    const formatExpirationDate = useCallback((grantedAt, planCycle) => {
        if (!grantedAt) return 'N/A';
        
        const startDateInMs = grantedAt.seconds ? grantedAt.seconds * 1000 : grantedAt;
        const startDate = new Date(startDateInMs);
        if (isNaN(startDate.getTime())) return 'Invalid date';
        
        const endDate = new Date(startDate);
        
        if (planCycle === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
            endDate.setMonth(endDate.getMonth() + 1);
        }
        
        return endDate.toLocaleDateString();
    }, []);

    // Scroll logic for the landing page (conceptual for RN)
    const scrollToSection = (sectionId) => {
        setIsMobileMenuOpen(false); 
        // In a real RN app with ScrollView on WelcomePage:
        // 1. You would dispatch a specific action or use Context to tell WelcomePage to scroll.
        console.log(`RN Navigation Placeholder: Scroll to section: ${sectionId}`);
    };

    // Component to display subscription info for mobile menu
    const SubscriptionInfoMobile = ({ type, premium }) => {
        if (!premium) return null;
        
        const iconColor = type === 'company' ? styles.subscriptionIconCompany.color : styles.subscriptionIconFamily.color;
        
        return (
            <View style={styles.subscriptionItemMobile}>
                <View style={styles.subscriptionItemHeader}>
                    <Icon name="CheckBadgeIcon" size={12} color={iconColor} />
                    <Text style={[styles.subscriptionItemText, { color: iconColor }]}>
                        {type.charAt(0).toUpperCase() + type.slice(1)} Premium
                    </Text>
                </View>
                <View style={styles.subscriptionDateGroup}>
                    <View style={styles.subscriptionDateItem}>
                        <Text style={styles.subscriptionDateLabel}>Start:</Text>
                        <Text style={styles.subscriptionDateValue}>{formatSubscriptionDate(premium.granted_at)}</Text>
                    </View>
                    <View style={styles.subscriptionDateItem}>
                        <Text style={styles.subscriptionDateLabel}>End:</Text>
                        <Text style={styles.subscriptionDateValue}>{formatExpirationDate(premium.granted_at, premium.plan_cycle)}</Text>
                    </View>
                </View>
            </View>
        );
    };


    // --- 1. PUBLIC LAYOUT ---
    if (isPublicLayout) { 
        
        const NavLink = ({ to, label, isCta = false }) => (
            <TouchableOpacity 
                onPress={() => {
                    setIsMobileMenuOpen(false);
                    // RN Navigation: navigation.navigate(to)
                    navigation.navigate(to);
                }}
                style={[
                    styles.navLinkBase, 
                    isCta ? styles.navLinkCta : styles.navLinkText
                ]}
            >
                <Text style={isCta ? styles.navLinkCtaText : styles.navLinkTextDefault}>{label}</Text>
            </TouchableOpacity>
        );

        return (
            <View style={styles.flexContainer}>
                {/* Navigation Header */}
                <View style={styles.publicNavContainer}>
                    <View style={styles.publicNavContent}>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('WelcomePage')}
                            style={styles.logoWrapper}
                        >
                            <Image source={FiamBondLogo} style={styles.logoImage} />
                            <View style={styles.logoTextGroup}>
                                <Text style={styles.logoText}>FiamBond</Text>
                                <View style={styles.logoSeparator}></View>
                                <Text style={styles.pageTitle}>{getPageTitle()}</Text>
                            </View>
                        </TouchableOpacity>

                        <View style={styles.publicActions}>
                            {/* Desktop Menu - Hidden in RN component, but kept for logical completeness */}
                            {isLandingPage && (
                                <View style={styles.publicDesktopMenu}>
                                    <TouchableOpacity onPress={() => scrollToSection('features')}><Text style={styles.menuItemText}>Features</Text></TouchableOpacity>
                                    <TouchableOpacity onPress={() => scrollToSection('pricing')}><Text style={styles.menuItemText}>Pricing</Text></TouchableOpacity>
                                </View>
                            )}
                            {isLandingPage && <View style={styles.menuSeparator}></View>}
                            <View style={styles.publicDesktopCta}>
                                <NavLink to="Login" label="Log In" />
                                <NavLink to="Register" label="Get Started" isCta={true} />
                            </View>
                            
                            {/* Mobile Hamburger Button */}
                            <TouchableOpacity 
                                onPress={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                style={styles.mobileMenuButton}
                            >
                                <Icon name={isMobileMenuOpen ? 'XMarkIcon' : 'Bars3Icon'} size={24} color={styles.mobileMenuIcon.color} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Mobile Menu Modal/Dropdown (using Modal for full coverage) */}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={isMobileMenuOpen}
                    onRequestClose={() => setIsMobileMenuOpen(false)}
                >
                    <TouchableWithoutFeedback onPress={() => setIsMobileMenuOpen(false)}>
                        <View style={styles.mobileMenuOverlay}>
                            <View style={styles.mobileMenuDropdown} onStartShouldSetResponder={() => true}>
                                <View style={styles.mobileMenuContent}>
                                    {isLandingPage && (
                                        <>
                                            <TouchableOpacity onPress={() => scrollToSection('features')} style={styles.mobileMenuItem}><Text style={styles.mobileMenuItemText}>Features</Text></TouchableOpacity>
                                            <TouchableOpacity onPress={() => scrollToSection('pricing')} style={styles.mobileMenuItem}><Text style={styles.mobileMenuItemText}>Pricing</Text></TouchableOpacity>
                                            <View style={styles.mobileMenuDivider}/>
                                        </>
                                    )}
                                    <NavLink to="Login" label="Log In" />
                                    <NavLink to="Register" label="Get Started" isCta={true} />
                                </View>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
                
                {/* Main Content Area (Web: <Outlet />) */}
                <ScrollView 
                    style={styles.mainContentPublic}
                    contentContainerStyle={styles.mainContentPublicContainer}
                >
                    {children}
                    
                    {/* Footer */}
                    <View style={styles.footerContainer}>
                        <View style={styles.footerContent}>
                            <View style={styles.logoWrapper}>
                                <Image source={FiamBondLogo} style={styles.footerLogoImage} />
                                <Text style={styles.footerLogoText}>FiamBond</Text>
                            </View>
                            <Text style={styles.footerCopyright}>&copy; {new Date().getFullYear()} Eman Ryan L. Aguilera. All rights reserved.</Text>
                            <View style={styles.footerLinks}>
                                <TouchableOpacity 
                                    onPress={() => navigation.navigate('Privacy')}
                                >
                                    <Text style={styles.footerLinkText}>Privacy Policy</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={() => navigation.navigate('Terms')}
                                >
                                    <Text style={styles.footerLinkText}>Terms of Service</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }

    // --- 2. DASHBOARD LAYOUT (AUTHENTICATED) ---
    return (
        <View style={styles.dashboardLayout}>
            {/* Header */}
            <View style={styles.dashboardHeader}>
                <View style={styles.dashboardNavContent}>
                    
                    {/* Logo Area */}
                    <TouchableOpacity 
                        onPress={() => navigation.navigate('WelcomePage')} // Redirect to a default realm/dashboard page in a real app
                        style={styles.logoWrapper}
                    >
                         <Image source={FiamBondLogo} style={styles.logoImage} />
                         <View style={styles.logoTextGroup}>
                            <Text style={styles.dashboardLogoText}>FiamBond</Text>
                            <View style={styles.logoSeparator}></View>
                            <Text style={styles.dashboardRealmText}>Realm</Text>
                         </View>
                    </TouchableOpacity>
                    
                    <View style={styles.dashboardActions}>
                        
                        {/* Subscription Status - Desktop/Tablet Only */}
                        {user && (
                            <View style={styles.subscriptionStatusDesktop}>
                                {/* Unified Subscription Display */}
                                {(premiumDetails?.company || premiumDetails?.family) ? (
                                    <View style={styles.subscriptionActiveBox}>
                                        <View style={styles.subscriptionIconGroup}>
                                            <Icon name="CheckBadgeIcon" size={16} color={styles.subscriptionActiveIcon.color} />
                                            <Text style={styles.subscriptionActiveText}>Subscriptions</Text>
                                        </View>
                                        
                                        {/* Company Subscription */}
                                        {premiumDetails.company && (
                                            <View style={styles.subscriptionDetails}>
                                                <View style={styles.bulletCompany}></View>
                                                <Text style={styles.subscriptionDetailText}>
                                                    Company: {formatExpirationDate(premiumDetails.company.granted_at, premiumDetails.company.plan_cycle)}
                                                </Text>
                                            </View>
                                        )}
                                        
                                        {/* Family Subscription */}
                                        {premiumDetails.family && (
                                            <View style={styles.subscriptionDetails}>
                                                <View style={styles.bulletFamily}></View>
                                                <Text style={styles.subscriptionDetailText}>
                                                    Family: {formatExpirationDate(premiumDetails.family.granted_at, premiumDetails.family.plan_cycle)}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                ) : (
                                    /* No Active Subscriptions */
                                    <View style={styles.subscriptionInactiveBox}>
                                        <Icon name="ClockIcon" size={16} color={styles.subscriptionInactiveIcon.color} />
                                        <Text style={styles.subscriptionInactiveText}>
                                            No subscriptions
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                        
                        {/* Desktop Profile Dropdown (using a Modal for RN) */}
                        {user && (
                            <View style={styles.profileDropdownDesktop}>
                                <TouchableOpacity 
                                    onPress={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                    style={styles.profileButton}
                                >
                                    <View style={styles.profileTextGroup}>
                                        <Text style={styles.profileName}>{user.full_name || 'User'}</Text>
                                    </View>
                                    <View style={styles.profileAvatar}>
                                        <Text style={styles.profileAvatarText}>
                                            {(user.full_name || user.email || 'U')[0].toUpperCase()}
                                        </Text>
                                    </View>
                                    <Icon name="ChevronDownIcon" size={16} color={styles.profileChevron.color} style={isProfileMenuOpen && styles.profileChevronRotated} />
                                </TouchableOpacity>

                                {/* Dropdown Menu (using Modal) */}
                                <Modal
                                    animationType="fade"
                                    transparent={true}
                                    visible={isProfileMenuOpen}
                                    onRequestClose={() => setIsProfileMenuOpen(false)}
                                >
                                    <TouchableWithoutFeedback onPress={() => setIsProfileMenuOpen(false)}>
                                        <View style={styles.dropdownModalOverlay}>
                                            {/* Position the dropdown manually relative to the button */}
                                            <View style={styles.dropdownMenu} onStartShouldSetResponder={() => true}>
                                                
                                                <TouchableOpacity 
                                                    onPress={() => {
                                                        setIsProfileMenuOpen(false);
                                                        // RN Navigation: navigation.navigate('Settings') (assuming a Settings screen exists)
                                                        console.log("RN Navigation Placeholder: navigation.navigate('Settings')");
                                                    }}
                                                    style={styles.dropdownItem}
                                                >
                                                    <Icon name="Cog6ToothIcon" size={16} color={styles.dropdownIcon.color} style={styles.dropdownIconStyle} />
                                                    <Text style={styles.dropdownItemText}>Settings</Text>
                                                </TouchableOpacity>
                                                <View style={styles.dropdownDivider}></View>
                                                <TouchableOpacity 
                                                    onPress={() => {
                                                        handleLogout();
                                                        setIsProfileMenuOpen(false);
                                                    }}
                                                    style={styles.dropdownItemLogout}
                                                >
                                                    <Icon name="ArrowLeftOnRectangleIcon" size={16} color={styles.logoutIcon.color} style={styles.dropdownIconStyle} />
                                                    <Text style={styles.dropdownItemTextLogout}>Sign Out</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </TouchableWithoutFeedback>
                                </Modal>
                            </View>
                        )}

                        {/* Mobile Hamburger Button */}
                        <TouchableOpacity 
                            onPress={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            style={styles.mobileMenuButton}
                        >
                            <Icon name={isMobileMenuOpen ? 'XMarkIcon' : 'Bars3Icon'} size={24} color={styles.mobileMenuIcon.color} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Mobile Menu (Modal) */}
            <Modal
                animationType="slide" 
                transparent={true}
                visible={isMobileMenuOpen}
                onRequestClose={() => setIsMobileMenuOpen(false)}
            >
                 <TouchableWithoutFeedback onPress={() => setIsMobileMenuOpen(false)}>
                    <View style={styles.mobileDashboardMenuOverlay}>
                        <View style={styles.mobileDashboardMenu} onStartShouldSetResponder={() => true}>
                            <ScrollView contentContainerStyle={styles.mobileDashboardMenuContent}>
                                {/* User Info Header in Mobile */}
                                <View style={styles.mobileUserInfoHeader}>
                                    <View style={styles.mobileAvatar}>
                                        <Text style={styles.mobileAvatarText}>
                                            {(user?.full_name || 'U')[0].toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.mobileUserInfoText}>
                                        <Text style={styles.mobileUserName}>{user?.full_name || 'User'}</Text>
                                        <Text style={styles.mobileUserEmail}>{user?.email}</Text>
                                    </View>
                                </View>
                                
                                {/* Subscription Info in Mobile */}
                                <View style={styles.mobileSubscriptionBox}>
                                    <Text style={styles.mobileSubscriptionTitle}>Subscriptions</Text>
                                    {premiumDetails?.company && <SubscriptionInfoMobile type="company" premium={premiumDetails.company} />}
                                    {premiumDetails?.family && <SubscriptionInfoMobile type="family" premium={premiumDetails.family} />}
                                    {!premiumDetails?.company && !premiumDetails?.family && (
                                        <Text style={styles.mobileNoSubscription}>No active subscriptions</Text>
                                    )}
                                </View>

                                {/* Mobile Navigation Links */}
                                <TouchableOpacity 
                                    onPress={() => {
                                        setIsMobileMenuOpen(false);
                                        console.log("RN Navigation Placeholder: navigation.navigate('Settings')");
                                    }}
                                    style={styles.mobileLink}
                                >
                                    <Icon name="Cog6ToothIcon" size={24} color={styles.mobileLinkIcon.color} style={styles.mobileLinkIconStyle} />
                                    <Text style={styles.mobileLinkText}>Settings</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    onPress={handleLogout}
                                    style={styles.mobileLinkLogout}
                                >
                                    <Icon name="ArrowLeftOnRectangleIcon" size={24} color={styles.mobileLogoutIcon.color} style={styles.mobileLinkIconStyle} />
                                    <Text style={styles.mobileLinkTextLogout}>Sign Out</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
            
            {/* Main Content Area (Web: <Outlet />) */}
            <View style={styles.dashboardMainContent}>
                {children}
            </View>
        </View>
    );
}


// --- React Native StyleSheet Conversion ---

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
    // --- GENERAL RN LAYOUT HELPERS ---
    flexContainer: {
        flex: 1,
        backgroundColor: '#f9fafb', // bg-gray-50
    },
    
    // --- PUBLIC LAYOUT STYLES ---
    publicNavContainer: {
        position: 'absolute',
        width: '100%',
        zIndex: 50,
        top: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)', // bg-white/80
        borderBottomWidth: 1,
        borderColor: '#e5e7eb', // border-gray-200
        height: 80,
    },
    publicNavContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        paddingHorizontal: 8,
        height: '100%',
        maxWidth: 1536, // max-w-screen-2xl
        alignSelf: 'center',
    },
    logoWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginRight: 16,
    },
    logoImage: {
        height: 36,
        width: 36,
        resizeMode: 'contain',
    },
    logoTextGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 20, // text-xl
        fontWeight: '700', // font-bold
        color: '#4f46e5', // text-indigo-600
        marginRight: 8,
    },
    logoSeparator: {
        height: 24,
        width: 1,
        backgroundColor: '#d1d5db', // bg-gray-300
        marginHorizontal: 12,
        display: screenWidth < 640 ? 'none' : 'flex', // hidden sm:block
    },
    pageTitle: {
        fontSize: 18, // text-lg
        color: '#6b7280', // text-gray-500
        fontWeight: '500', // font-medium
        display: screenWidth < 640 ? 'none' : 'flex', // hidden sm:block
    },
    publicActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 32,
        marginLeft: 'auto',
    },
    publicDesktopMenu: {
        flexDirection: 'row',
        gap: 32,
        display: screenWidth < 768 ? 'none' : 'flex', // hidden md:block
    },
    menuItemText: {
        color: '#4b5563', // text-gray-600
        fontWeight: '700', // font-bold
        fontSize: 14, // text-sm
    },
    menuSeparator: {
        height: 24,
        width: 1,
        backgroundColor: '#e5e7eb', // bg-gray-200
        display: screenWidth < 768 ? 'none' : 'flex', // hidden md:block
    },
    publicDesktopCta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        display: screenWidth < 768 ? 'none' : 'flex', // hidden md:flex
    },
    navLinkBase: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    navLinkText: {
        // No background, just text
    },
    navLinkTextDefault: {
        color: '#111827', // text-gray-900
        fontWeight: '700', // font-bold
        fontSize: 14, // text-sm
    },
    navLinkCta: {
        backgroundColor: '#4f46e5', // bg-indigo-600
        borderRadius: 8, // rounded-lg
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    navLinkCtaText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
    },
    mobileMenuButton: {
        padding: 8,
        color: '#4b5563', // text-gray-600
        borderRadius: 6,
        display: screenWidth >= 768 ? 'none' : 'flex', // md:hidden
    },
    mobileMenuIcon: {
        color: '#4b5563',
    },
    
    // Mobile Menu Styles (RN uses Modal for this)
    mobileMenuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        paddingTop: 80, // Offset for fixed header
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
    },
    mobileMenuDropdown: {
        width: '100%',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderColor: '#f3f4f6', // border-gray-100
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    mobileMenuContent: {
        flexDirection: 'column',
        padding: 16,
        gap: 12,
    },
    mobileMenuItem: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
    },
    mobileMenuItemText: {
        textAlign: 'left',
        fontWeight: '600', // font-semibold
        color: '#374151', // text-gray-700
    },
    mobileMenuDivider: {
        borderBottomWidth: 1,
        borderColor: '#f3f4f6', // border-gray-100
        marginVertical: 4,
    },

    mainContentPublic: {
        flex: 1,
        marginTop: 80, // pt-20
    },
    mainContentPublicContainer: {
        flexGrow: 1, // Ensures content can grow to fill screen
    },

    // Footer
    footerContainer: {
        backgroundColor: 'white',
        paddingVertical: 48, // py-12
        borderTopWidth: 1,
        borderColor: '#e5e7eb', // border-gray-200
    },
    footerContent: {
        marginHorizontal: 16,
        maxWidth: 1536,
        alignSelf: 'center',
        flexDirection: screenWidth < 768 ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 24,
    },
    footerLogoImage: {
        height: 32,
        width: 32,
        resizeMode: 'contain',
    },
    footerLogoText: {
        fontSize: 20, // text-xl
        fontWeight: '700', // font-bold
        color: '#4f46e5', // text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 - simplified to indigo-600
    },
    footerCopyright: {
        color: '#6b7280', // text-gray-500
        fontSize: 12, // text-sm
    },
    footerLinks: {
        flexDirection: 'row',
        gap: 32,
    },
    footerLinkText: {
        color: '#6b7280', // text-gray-500
        fontSize: 14, // text-sm
        fontWeight: '500', // font-medium
    },

    // --- DASHBOARD LAYOUT STYLES ---
    dashboardLayout: {
        flex: 1,
        backgroundColor: '#f9fafb', // bg-gray-50
    },
    dashboardHeader: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderBottomWidth: 1,
        borderColor: '#e5e7eb',
        height: 80,
    },
    dashboardNavContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%',
        marginHorizontal: 16,
        maxWidth: 1536,
        alignSelf: 'center',
    },
    dashboardLogoText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#4f46e5', // Simplified gradient to indigo-600
    },
    dashboardRealmText: {
        fontSize: 18,
        color: '#6b7280',
        fontWeight: '500',
        display: screenWidth < 640 ? 'none' : 'flex', // hidden sm:block
    },
    dashboardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
    },
    
    // Subscription Status Desktop
    subscriptionStatusDesktop: {
        display: screenWidth < 768 ? 'none' : 'flex', // hidden md:flex
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    subscriptionActiveBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    subscriptionIconGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    subscriptionActiveIcon: {
        color: '#4f46e5', // text-indigo-600
    },
    subscriptionActiveText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#4b5563', // text-gray-700
    },
    subscriptionDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    bulletCompany: {
        height: 8,
        width: 8,
        backgroundColor: '#10b981', // bg-emerald-500
        borderRadius: 9999,
    },
    bulletFamily: {
        height: 8,
        width: 8,
        backgroundColor: '#3b82f6', // bg-blue-500
        borderRadius: 9999,
    },
    subscriptionDetailText: {
        fontSize: 12,
        color: '#4b5563', // text-gray-600
    },
    subscriptionInactiveBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#f9fafb', // bg-gray-50
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
    },
    subscriptionInactiveIcon: {
        color: '#9ca3af', // text-gray-400
    },
    subscriptionInactiveText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#6b7280', // text-gray-500
    },
    
    // Desktop Profile Dropdown
    profileDropdownDesktop: {
        display: screenWidth < 768 ? 'none' : 'flex',
    },
    profileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 4,
        borderRadius: 8,
    },
    profileTextGroup: {
        alignItems: 'flex-end',
        marginRight: 4,
    },
    profileName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1f2937', // text-gray-800
        textTransform: 'capitalize',
        letterSpacing: 0.5,
    },
    profileAvatar: {
        height: 36,
        width: 36,
        backgroundColor: '#e0e7ff', // bg-indigo-100
        borderRadius: 9999,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#c7d2fe', // border-indigo-200
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
        elevation: 1,
    },
    profileAvatarText: {
        color: '#4f46e5', // text-indigo-700
        fontWeight: '700',
        fontSize: 14,
    },
    profileChevron: {
        color: '#9ca3af', // text-gray-400
    },
    profileChevronRotated: {
        transform: [{ rotate: '180deg' }],
    },

    // Dropdown Modal/Menu
    dropdownModalOverlay: {
        flex: 1,
        paddingTop: 70, 
        paddingRight: 10,
        alignItems: 'flex-end',
    },
    dropdownMenu: {
        width: 256, // w-64
        backgroundColor: 'white',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#f3f4f6', // border-gray-100
        paddingVertical: 8,
        position: 'absolute',
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    dropdownItemText: {
        fontSize: 14,
        color: '#374151', // text-gray-700
        fontWeight: '500', // font-medium
    },
    dropdownIcon: {
        color: '#374151',
    },
    dropdownIconStyle: {
        marginRight: 8,
    },
    dropdownDivider: {
        borderTopWidth: 1,
        borderColor: '#f3f4f6', // border-gray-100
        marginVertical: 4,
    },
    dropdownItemLogout: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    dropdownItemTextLogout: {
        fontSize: 14,
        color: '#dc2626', // text-red-600
        fontWeight: '500',
    },
    logoutIcon: {
        color: '#dc2626',
    },

    // Mobile Dashboard Menu
    mobileDashboardMenuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        paddingTop: 80,
    },
    mobileDashboardMenu: {
        width: '100%',
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderColor: '#e5e7eb', // border-gray-200
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
        paddingBottom: 20,
    },
    mobileDashboardMenuContent: {
        paddingHorizontal: 8,
        paddingVertical: 8,
        gap: 4,
    },
    mobileUserInfoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginBottom: 8,
        backgroundColor: '#eef2ff', // bg-indigo-50
        borderRadius: 8,
        marginHorizontal: 8,
    },
    mobileAvatar: {
        height: 40,
        width: 40,
        borderRadius: 9999,
        backgroundColor: '#e0e7ff', // bg-indigo-100
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#c7d2fe', // border-indigo-200
        borderWidth: 1,
    },
    mobileAvatarText: {
        color: '#4f46e5', // text-indigo-700
        fontWeight: '700',
        fontSize: 16,
    },
    mobileUserInfoText: {
        marginLeft: 12,
    },
    mobileUserName: {
        fontSize: 16,
        fontWeight: '700',
        textTransform: 'capitalize',
        color: '#1f2937', // text-gray-800
        letterSpacing: 0.5,
    },
    mobileUserEmail: {
        fontSize: 12,
        fontWeight: '500',
        color: '#6b7280', // text-gray-500
    },

    // Mobile Subscription Info
    mobileSubscriptionBox: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderColor: '#f3f4f6', // border-gray-100
        marginHorizontal: 8,
    },
    mobileSubscriptionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280', // text-gray-500
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    subscriptionItemMobile: {
        marginBottom: 8,
    },
    subscriptionItemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        fontWeight: '500',
    },
    subscriptionIconCompany: {
        color: '#10b981', // text-emerald-500
    },
    subscriptionIconFamily: {
        color: '#3b82f6', // text-blue-500
    },
    subscriptionItemText: {
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    subscriptionDateGroup: {
        flexDirection: 'row',
        marginTop: 4,
        gap: 8,
    },
    subscriptionDateItem: {
        // Half width (grid-cols-2)
        width: '48%', 
    },
    subscriptionDateLabel: {
        fontSize: 10, // text-[11px] approximation
        color: '#9ca3af', // text-gray-400
    },
    subscriptionDateValue: {
        fontSize: 10,
        fontFamily: 'monospace', // font-mono
    },
    mobileNoSubscription: {
        fontSize: 12,
        color: '#9ca3af', // text-gray-400
        fontStyle: 'italic',
        paddingVertical: 8,
        textAlign: 'center',
    },

    mobileLink: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 6,
    },
    mobileLinkText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#4b5563', // text-gray-700
    },
    mobileLinkIcon: {
        color: '#9ca3af', // text-gray-400
    },
    mobileLinkIconStyle: {
        marginRight: 12,
    },
    mobileLinkLogout: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 6,
    },
    mobileLinkTextLogout: {
        fontSize: 16,
        fontWeight: '500',
        color: '#dc2626', // text-red-600
    },
    mobileLogoutIcon: {
        color: '#dc2626',
    },

    dashboardMainContent: {
        flex: 1,
        width: '100%',
        maxWidth: 1536,
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingVertical: 32,
    },
});