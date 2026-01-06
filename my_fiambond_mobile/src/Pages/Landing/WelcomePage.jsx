import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    Dimensions // Still import Dimensions if you might need it later, but remove unused variable
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// --- ICONS (Converted to simple Text placeholders) ---
// For a real app, you would use a library like 'react-native-vector-icons'.

const CheckIcon = () => (
    <Text style={[s.iconText, { color: '#10B981', fontSize: 18, lineHeight: 22 }]}>✓</Text>
);
const CrossIcon = () => (
    <Text style={[s.iconText, { color: '#94A3B8', fontSize: 18, lineHeight: 22 }]}>✕</Text>
);
const ShieldIcon = () => (
    <View style={s.iconWrapper}>
        <Text style={{ fontSize: 24, color: '#4F46E5' }}>🛡</Text>
    </View>
);
const UsersIcon = () => (
    <View style={s.iconWrapper}>
        <Text style={{ fontSize: 24, color: '#4F46E5' }}>👥</Text>
    </View>
);
const BuildingIcon = () => (
    <View style={s.iconWrapper}>
        <Text style={{ fontSize: 24, color: '#4F46E5' }}>🏢</Text>
    </View>
);
const CloudIcon = () => (
    <Text style={[s.iconText, { color: '#10B981', fontSize: 18, lineHeight: 22 }]}>☁</Text>
);
const GraphIcon = () => (
    <Text style={[s.iconText, { color: '#10B981', fontSize: 18, lineHeight: 22 }]}>📈</Text>
);

// Removed: const { width } = Dimensions.get('window');

// --- COMPONENT START ---
export default function WelcomePage() {
    const navigation = useNavigation();
    
    const [billingCycle, setBillingCycle] = useState('monthly');
    const getPrice = (monthly, annual) => billingCycle === 'monthly' ? monthly : annual;
    const getPeriod = () => billingCycle === 'monthly' ? '/mo' : '/yr';

    // NEW PRICING CONSTANTS
    const FAMILY_MONTHLY = '₱500';
    const FAMILY_ANNUAL = '₱5,000'; 
    const COMPANY_MONTHLY = '₱1,500';
    const COMPANY_ANNUAL = '₱15,000'; 

    const handleScroll = (id) => {
        console.log(`Attempting to scroll to: ${id} (React Native conversion: use ScrollView ref)`);
    };

    const navigateToRegister = (realm) => {
        if (realm) {
            // NOTE: 'Register' screen must be defined in your App.tsx Stack.Navigator
            navigation.navigate('Register', { realm }); 
        } else {
            // Navigate to the general Register screen
            navigation.navigate('Register');
        }
    };

    return (
        <ScrollView style={s.container} contentContainerStyle={s.contentContainer}>
            {/* --- HERO SECTION --- */}
            <View style={s.heroSection}>
                <View style={s.heroContent}>
                    
                    {/* Text Side */}
                    <View style={s.heroText}>
                        <View style={s.tag}>
                            <View style={s.tagDot}></View>
                            <Text style={s.tagText}>v1.0 Public Release</Text>
                        </View>
                        
                        <Text style={s.headline}>
                            Take Control of 
                            {'\n'}
                            <Text style={s.gradientText}>
                                Your Finances
                            </Text>
                        </Text>
                        
                        <Text style={s.subHeadline}>
                            FiamBond is the ledger of truth for personal loans, family budgets, and company payroll.
                            Stop relying on memory. Start tracking today.
                        </Text>
                        
                        <View style={s.ctaContainer}>
                            {/* UNIFIED ENTRY POINT: Start Free Account -> UserRealm (as per instruction) */}
                            <TouchableOpacity 
                                onPress={() => navigateToRegister()} 
                                style={[s.primaryBtn, s.primaryBtnLg]}
                            >
                                <Text style={s.primaryBtnTextLg}>Start Free Account</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => handleScroll('features')}
                                style={[s.secondaryBtn, s.secondaryBtnLg]}
                            >
                                <Text style={s.secondaryBtnTextLg}>View Features</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={s.disclaimer}>
                            <Text style={s.disclaimerText}>
                                <Text style={s.disclaimerStrong}>Disclaimer:</Text> This is a demo application. No real money or bank connections involved.
                            </Text>
                        </View>
                    </View>

                    {/* Image Side - Replaced with a placeholder View */}
                    <View style={s.heroVisualPlaceholder}>
                        <View style={s.heroVisualInner}>
                            <Text style={s.placeholderText}>Dashboard Preview (Image Asset)</Text>
                        </View>
                        <View style={s.heroVisualCallout}>
                            <View style={s.heroVisualCalloutContent}>
                                <View style={s.heroVisualCalloutIcon}>
                                    <ShieldIcon />
                                </View>
                                <View>
                                    <Text style={s.calloutLabel}>Security</Text>
                                    <Text style={s.calloutValue}>AES-256 Encrypted</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* --- FEATURES GRID --- */}
            <View style={s.featuresSection}>
               <View style={s.sectionHeader}>
                    <Text style={s.sectionTitle}>One App. Three Realms.</Text>
                    <Text style={s.sectionSubTitle}>
                        FiamBond adapts to your context. Whether you are managing your personal finances, 
                        a household budget, or running a company.
                    </Text>
                </View>

                <View style={s.featureGrid}>
                    {/* Personal Realm */}
                    <View style={s.featureCard}>
                        <View style={s.featureIconBox}><ShieldIcon /></View>
                        <Text style={s.featureTitle}>Personal Realm (Free)</Text>
                        <Text style={s.featureText}>
                            Your private financial dashboard for **transactions, goals, and loans**. Includes full history,
                            transaction graphs, and Cloudinary receipt uploads.
                        </Text>
                    </View>
                    {/* Family Realm */}
                    <View style={s.featureCard}>
                        <View style={s.featureIconBox}><UsersIcon /></View>
                        <Text style={s.featureTitle}>Family Realm</Text>
                        <Text style={s.featureText}>
                            Create a shared financial space. Invite family members via email and manage **shared
                            transactions, goals, and loans** with complete transparency. **Separate from Company.**
                        </Text>
                    </View>
                    {/* Company Realm */}
                    <View style={s.featureCard}>
                        <View style={s.featureIconBox}><BuildingIcon /></View>
                        <Text style={s.featureTitle}>Company Realm</Text>
                        <Text style={s.featureText}>
                            A professional suite to manage **employees, company funds, goals**, and generate
                            **payroll reports (CSV, Excel, PDF)**. **Separate from Family.**
                        </Text>
                    </View>
                </View>
            </View>

            {/* --- PRICING --- */}
            <View style={s.pricingSection}>
                <View style={s.pricingHeader}>
                    <Text style={s.pricingTitle}>Flexible Pricing by Realm</Text>
                    <Text style={s.pricingSubTitle}>Start for free. Upgrade to collaborate with family or manage a team.</Text>
                    
                    <View style={s.billingCycleToggle}>
                        <TouchableOpacity 
                            onPress={() => setBillingCycle('monthly')} 
                            style={[s.cycleBtn, billingCycle === 'monthly' && s.cycleBtnActive]}
                        >
                            <Text style={[s.cycleBtnText, billingCycle === 'monthly' && s.cycleBtnTextActive]}>Monthly</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => setBillingCycle('annual')} 
                            style={[s.cycleBtn, billingCycle === 'annual' && s.cycleBtnActive]}
                        >
                            <Text style={[s.cycleBtnText, billingCycle === 'annual' && s.cycleBtnTextActive]}>
                                Annual
                            </Text>
                            <View style={s.annualBadge}>
                                <Text style={s.annualBadgeText}>Save up to 20%</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={s.pricingGrid}>
                    {/* PERSONAL (FREE) - UNIFIED LINK */}
                    <View style={[s.pricingCard, s.pricingCardFree]}>
                        <View style={s.cardContent}>
                            <Text style={s.cardTitle}>Personal Realm</Text>
                            <Text style={s.cardSubTitle}>For individuals, private finances & loans.</Text>
                            <Text style={s.cardPrice}>₱0<Text style={s.cardPeriod}>/mo</Text></Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => navigateToRegister()} 
                            style={s.cardBtnSecondary}
                        >
                            <Text style={s.cardBtnTextSecondary}>Get Started - Free (Sign Up)</Text>
                        </TouchableOpacity>
                        <View style={s.cardList}>
                            <View style={s.cardListItem}><CheckIcon /><Text style={s.cardListItemText}>Unlimited Transactions, Goals, Loans</Text></View>
                            <View style={s.cardListItem}><CheckIcon /><Text style={s.cardListItemText}>Full History Display & Graph</Text></View>
                            <View style={s.cardListItem}><CloudIcon /><Text style={s.cardListItemText}>Cloudinary Receipt Upload</Text></View>
                            <View style={s.cardListItemDisabled}><CrossIcon /><Text style={s.cardListItemTextDisabled}>Cannot Create/Join Family Realm</Text></View>
                            <View style={s.cardListItemDisabled}><CrossIcon /><Text style={s.cardListItemTextDisabled}>No Employee Management</Text></View>
                        </View>
                    </View>
                    
                    {/* FAMILY - UNIFIED LINK */}
                    <View style={[s.pricingCard, s.pricingCardFamily]}>
                        <View style={s.familyBadge}><Text style={s.familyBadgeText}>Family Collaboration</Text></View>
                        <View style={s.cardContent}>
                            <Text style={s.cardTitleFamily}>Family Realm</Text>
                            <Text style={s.cardSubTitleFamily}>For households & collaborative budgeting.</Text>
                            <Text style={s.cardPriceFamily}>{getPrice(FAMILY_MONTHLY, FAMILY_ANNUAL)}<Text style={s.cardPeriodFamily}>{getPeriod()}</Text></Text>
                        </View>
                         <TouchableOpacity 
                            onPress={() => navigateToRegister('family')} 
                            style={[s.primaryBtn, s.cardBtnPrimaryLg]}
                        >
                            <Text style={s.primaryBtnTextLg}>Sign Up / Log In to Request Access</Text>
                        </TouchableOpacity>
                        <Text style={s.cardDisclaimer}>
                            Request requires prior registration, GCash payment, and Admin check.
                        </Text>
                        <View style={s.cardList}>
                            <View style={s.cardListItemFamily}><CheckIcon /><Text style={s.cardListItemTextFamily}>All Personal Realm Features</Text></View>
                            <View style={s.cardListItemFamily}><CheckIcon /><Text style={s.cardListItemTextFamily}><Text style={{fontWeight: 'bold'}}>Dedicated Family Realm Access</Text></Text></View>
                            <View style={s.cardListItemFamily}><CheckIcon /><Text style={s.cardListItemTextFamily}>Invite Members via Email</Text></View>
                            <View style={s.cardListItemFamily}><CheckIcon /><Text style={s.cardListItemTextFamily}>Shared Transaction, Goal, & Loan</Text></View>
                            <View style={s.cardListItemDisabledFamily}><CrossIcon /><Text style={s.cardListItemTextDisabledFamily}>No Company Realm Access</Text></View>
                        </View>
                    </View>

                    {/* COMPANY - UNIFIED LINK */}
                    <View style={[s.pricingCard, s.pricingCardFree]}>
                        <View style={s.cardContent}>
                            <Text style={s.cardTitle}>Company Realm</Text>
                            <Text style={s.cardSubTitle}>For startups, businesses & organizational funds.</Text>
                            <Text style={s.cardPrice}>{getPrice(COMPANY_MONTHLY, COMPANY_ANNUAL)}<Text style={s.cardPeriod}>{getPeriod()}</Text></Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => navigateToRegister('company')} 
                            style={s.cardBtnSecondary}
                        >
                            <Text style={s.cardBtnTextSecondary}>Sign Up / Log In to Request Access</Text>
                        </TouchableOpacity>
                        <Text style={s.cardDisclaimer}>
                            Request requires prior registration, GCash payment, and Admin check.
                        </Text>
                        <View style={s.cardList}>
                            <View style={s.cardListItem}><CheckIcon /><Text style={s.cardListItemText}>All Personal Realm Features</Text></View>
                            <View style={s.cardListItem}><CheckIcon /><Text style={s.cardListItemText}><Text style={{fontWeight: 'bold'}}>Dedicated Company Realm Access</Text></Text></View>
                            <View style={s.cardListItem}><CheckIcon /><Text style={s.cardListItemText}>Manage Employees & Company Funds</Text></View>
                            <View style={s.cardListItem}><CheckIcon /><Text style={s.cardListItemText}>Payroll Reports (CSV, Excel, PDF)</Text></View>
                            <View style={s.cardListItemDisabled}><CrossIcon /><Text style={s.cardListItemTextDisabled}>Cannot Create/Join Family Realm</Text></View>
                        </View>
                    </View>
                </View>
            </View>
             
        </ScrollView>
    );
}

// --- STYLESHEET (Tailwind to React Native Conversion) ---
const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB', // bg-gray-50
    },
    contentContainer: {
        paddingBottom: 40,
    },
    
    // --- HERO SECTION ---
    heroSection: {
        paddingTop: 112, // pt-28
        paddingBottom: 64, // pb-16
        backgroundColor: '#FFFFFF', // bg-white (simplified gradient)
    },
    heroContent: {
        maxWidth: 1440, // max-w-screen-2xl
        marginHorizontal: 'auto',
        paddingHorizontal: 24, // px-6
    },
    heroText: {
        alignItems: 'center', // text-center (RN equivalent)
        marginBottom: 40, // gap-10/20 items-center
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // gap-2
        paddingVertical: 6, // py-1.5
        paddingHorizontal: 12, // px-3
        borderRadius: 9999, // rounded-full
        backgroundColor: '#FFFFFF', // bg-white
        borderWidth: 1,
        borderColor: '#E0E7FF', // border-indigo-100
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1, // shadow-sm
        color: '#4F46E5', // text-indigo-600
        marginBottom: 24, // mb-6
    },
    tagDot: {
        width: 8,
        height: 8,
        borderRadius: 9999,
        backgroundColor: '#4ade80', // bg-green-400
    },
    tagText: {
        fontSize: 12, // text-xs
        fontWeight: '700', // font-bold
        textTransform: 'uppercase',
        letterSpacing: 1.2, // tracking-wide
        color: '#4F46E5',
    },
    headline: {
        fontSize: 36, // text-4xl
        lineHeight: 44, // leading-tight
        fontWeight: '800', // font-extrabold
        marginBottom: 24, // mb-6
        color: '#111827', // text-gray-900
        textAlign: 'center',
    },
    gradientText: {
        // Simple color for RN, can't do true gradient clip text easily
        color: '#4F46E5', // from-indigo-600 to-indigo-500
    },
    subHeadline: {
        fontSize: 18, // text-lg
        lineHeight: 28, // leading-relaxed
        color: '#4B5563', // text-gray-600
        marginBottom: 32, // mb-8
        maxWidth: 512, // max-w-lg
        textAlign: 'center',
    },
    ctaContainer: {
        flexDirection: 'column',
        gap: 16, // gap-4
        alignSelf: 'stretch', // justify-center
        paddingHorizontal: 16, // px-4
    },
    primaryBtn: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#4F46E5', // bg-indigo-600
        borderRadius: 12, // rounded-xl
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 6, // shadow-lg
    },
    primaryBtnLg: {
        paddingHorizontal: 32, // px-8
        paddingVertical: 16, // py-4
    },
    primaryBtnTextLg: {
        fontSize: 18, // text-lg
        fontWeight: '600', // font-semibold
        color: '#FFFFFF',
        textAlign: 'center',
    },
    secondaryBtn: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF', // bg-white
        borderWidth: 1,
        borderColor: '#E5E7EB', // border-gray-200
        borderRadius: 12, // rounded-xl
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1, // shadow-sm
    },
    secondaryBtnLg: {
        paddingHorizontal: 32, // px-8
        paddingVertical: 16, // py-4
    },
    secondaryBtnTextLg: {
        fontSize: 18, // text-lg
        fontWeight: '600', // font-semibold
        color: '#4B5563', // text-gray-700
        textAlign: 'center',
    },
    disclaimer: {
        marginTop: 40, // mt-10
        padding: 16, // p-4
        backgroundColor: 'rgba(255, 255, 255, 0.9)', 
        borderLeftWidth: 4,
        borderLeftColor: '#3B82F6', // border-l-blue-500
        borderRadius: 12, // rounded-xl 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1, // shadow-sm
    },
    disclaimerText: {
        fontSize: 14, // text-sm
        color: '#4B5563', // text-gray-600
    },
    disclaimerStrong: {
        color: '#1D4ED8', // text-blue-700
        fontWeight: 'bold',
    },
    heroVisualPlaceholder: {
        display: 'none', // Hidden for mobile view
    },
    // The following styles are for the visual side, adapting the appearance for RN
    heroVisualInner: {
        width: '100%',
        aspectRatio: 16/9,
        backgroundColor: '#E0E7FF', // Indigo-100 placeholder
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    placeholderText: {
        color: '#6366F1',
        fontWeight: 'bold',
    },
    heroVisualCallout: {
        position: 'absolute',
        bottom: -24, // -bottom-6
        left: -24, // -left-6
        backgroundColor: '#FFFFFF', // bg-white
        padding: 16, // p-4
        borderRadius: 12, // rounded-xl
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 6, // shadow-xl
        borderWidth: 1,
        borderColor: '#F3F4F6', // border-gray-100
    },
    heroVisualCalloutContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12, // gap-3
    },
    heroVisualCalloutIcon: {
        padding: 8, // p-2
        backgroundColor: '#D1FAE5', // bg-green-100
        borderRadius: 9999, // rounded-full
    },
    calloutLabel: {
        fontSize: 12, // text-xs
        color: '#6B7280', // text-gray-500
        textTransform: 'uppercase',
        fontWeight: '600', // font-semibold
    },
    calloutValue: {
        fontSize: 14, // text-sm
        fontWeight: '700', // font-bold
        color: '#1F2937', // text-gray-800
    },
    
    // --- FEATURES GRID ---
    featuresSection: {
        paddingVertical: 64, // py-16
        backgroundColor: '#FFFFFF', // bg-white
        paddingHorizontal: 24,
    },
    sectionHeader: {
        marginBottom: 64, // mb-16
        maxWidth: 768, // max-w-2xl
        alignSelf: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 30, // text-3xl
        fontWeight: '800', // font-extrabold
        color: '#111827', // text-gray-900
        marginBottom: 16, // mb-4
        textAlign: 'center',
    },
    sectionSubTitle: {
        fontSize: 18, // text-lg
        color: '#6B7280', // text-gray-500
        lineHeight: 28, // leading-relaxed
        textAlign: 'center',
    },
    featureGrid: {
        gap: 32, // gap-8
    },
    featureCard: {
        padding: 32, // p-8
        borderRadius: 24, // rounded-3xl
        backgroundColor: '#F9FAFB', // bg-gray-50
        borderWidth: 1,
        borderColor: '#F3F4F6', // border-gray-100
    },
    featureIconBox: {
        width: 56, // w-14
        height: 56, // h-14
        backgroundColor: '#FFFFFF', // bg-white
        borderRadius: 16, // rounded-2xl
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1, // shadow-sm
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24, // mb-6
        borderWidth: 1,
        borderColor: '#F3F4F6', // border-gray-100
    },
    featureTitle: {
        fontSize: 20, // text-xl
        fontWeight: '700', // font-bold
        color: '#111827', // text-gray-900
        marginBottom: 12, // mb-3
    },
    featureText: {
        color: '#4B5563', // text-gray-600
        lineHeight: 24, // leading-relaxed
        fontSize: 15,
    },

    // --- PRICING ---
    pricingSection: {
        paddingVertical: 80, // py-20
        backgroundColor: '#1F2937', // bg-slate-900
        paddingHorizontal: 24,
    },
    pricingHeader: {
        alignItems: 'center',
        marginBottom: 48, // mb-12
    },
    pricingTitle: {
        fontSize: 30, // text-3xl
        fontWeight: '800', // font-extrabold
        color: '#FFFFFF',
        marginBottom: 16, // mb-4
        textAlign: 'center',
    },
    pricingSubTitle: {
        color: '#9CA3AF', // text-slate-400
        fontSize: 18, // text-lg
        textAlign: 'center',
    },
    billingCycleToggle: {
        marginTop: 32, // mt-8
        flexDirection: 'row',
        backgroundColor: '#374151', // bg-slate-800
        borderRadius: 12, // rounded-xl
        padding: 4, // p-1
        borderWidth: 1,
        borderColor: '#4B5563', // border-slate-700
    },
    cycleBtn: {
        paddingHorizontal: 24, // px-6
        paddingVertical: 8, // py-2
        borderRadius: 8, // rounded-lg
        flexDirection: 'row',
        alignItems: 'center',
    },
    cycleBtnActive: {
        backgroundColor: '#4F46E5', // bg-indigo-600
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 6, // shadow-lg
    },
    cycleBtnText: {
        fontSize: 14, // text-sm
        fontWeight: '700', // font-bold
        color: '#9CA3AF', // text-slate-400
    },
    cycleBtnTextActive: {
        color: '#FFFFFF',
    },
    annualBadge: {
        marginLeft: 8, // ml-2
        borderRadius: 9999,
        backgroundColor: 'rgba(16, 185, 129, 0.2)', // bg-green-500/20
        paddingHorizontal: 8, // px-2
        paddingVertical: 2, // py-0.5
    },
    annualBadgeText: {
        fontSize: 10, // text-xs
        fontWeight: '500', // font-medium
        color: '#4ADE80', // text-green-400
    },
    pricingGrid: {
        gap: 32, // gap-8
    },
    pricingCard: {
        borderRadius: 24, // rounded-3xl
        padding: 32, // p-8
        flexDirection: 'column',
        height: 'auto', // flex-col h-full
    },
    pricingCardFree: {
        backgroundColor: 'rgba(55, 65, 81, 0.5)', // bg-slate-800/50
        borderWidth: 1,
        borderColor: '#4B5563', // border-slate-700
    },
    cardContent: {
        marginBottom: 24, // mb-6
    },
    cardTitle: {
        fontSize: 24, // text-2xl
        fontWeight: '700', // font-bold
        color: '#FFFFFF',
    },
    cardSubTitle: {
        color: '#9CA3AF', // text-slate-400
        fontSize: 14, // text-sm
        marginTop: 8, // mt-2
    },
    cardPrice: {
        fontSize: 36, // text-4xl
        fontWeight: '700', // font-bold
        marginBottom: 32, // mb-8
        color: '#FFFFFF',
    },
    cardPeriod: {
        fontSize: 18, // text-lg
        color: '#6B7280', // text-slate-500
        fontWeight: '400', // font-normal
    },
    cardBtnSecondary: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        marginBottom: 32, // mb-8
        backgroundColor: '#4B5563', // bg-slate-700
        paddingVertical: 12, // py-3
        borderRadius: 12, // rounded-xl
    },
    cardBtnTextSecondary: {
        color: '#FFFFFF',
        textAlign: 'center',
        fontWeight: '600',
    },
    cardList: {
        gap: 16, // space-y-4
        flexGrow: 1,
    },
    cardListItem: {
        flexDirection: 'row',
        gap: 12, // gap-3
        alignItems: 'center',
    },
    cardListItemText: {
        fontSize: 14, // text-sm
        color: '#D1D5DB', // text-slate-300
        flex: 1, // To make text wrap
    },
    cardListItemDisabled: {
        flexDirection: 'row',
        gap: 12, // gap-3
        alignItems: 'center',
    },
    cardListItemTextDisabled: {
        fontSize: 14, // text-sm
        color: '#4B5563', // text-slate-600
        flex: 1,
    },
    
    // Family Card Specific
    pricingCardFamily: {
        backgroundColor: '#FFFFFF', // bg-white
        borderColor: '#4F46E5', // border-indigo-600
        borderWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10, // shadow-2xl
        zIndex: 10,
        marginVertical: 16, // To visually "pop" it out
    },
    familyBadge: {
        position: 'absolute',
        top: 0,
        alignSelf: 'center', 
        marginTop: -12, // -mt-3
        backgroundColor: '#4F46E5', // bg-indigo-600
        borderRadius: 9999,
        paddingHorizontal: 16, // px-4
        paddingVertical: 4, // py-1
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3, // shadow-md
    },
    familyBadgeText: {
        color: '#FFFFFF',
        fontSize: 12, // text-xs
        fontWeight: '700', // font-bold
        textTransform: 'uppercase',
        letterSpacing: 1, // tracking-wide
    },
    cardTitleFamily: {
        fontSize: 24, // text-2xl
        fontWeight: '700', // font-bold
        color: '#1E3A8A', // text-indigo-900
        marginTop: 8, // mt-2 (to compensate for badge)
    },
    cardSubTitleFamily: {
        color: '#6B7280', // text-gray-500
        fontSize: 14, // text-sm
        marginTop: 8, // mt-2
    },
    cardPriceFamily: {
        fontSize: 40, // text-5xl
        fontWeight: '700', // font-bold
        marginBottom: 32, // mb-8
        color: '#1F2937', // text-gray-900
    },
    cardPeriodFamily: {
        fontSize: 18, // text-lg
        color: '#9CA3AF', // text-gray-400
        fontWeight: '400', // font-normal
    },
    cardBtnPrimaryLg: {
        width: '100%',
        marginBottom: 4, // mb-4
        paddingVertical: 16, // py-4
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardDisclaimer: {
        fontSize: 12, // text-xs
        textAlign: 'center',
        color: '#6B7280', // text-gray-500
        fontWeight: '600', // font-semibold
        marginBottom: 32, // mb-8
    },
    cardListItemFamily: {
        flexDirection: 'row',
        gap: 12, // gap-3
        alignItems: 'center',
    },
    cardListItemTextFamily: {
        fontSize: 14, // text-sm
        color: '#4B5563', // text-gray-600
        fontWeight: '500', // font-medium
        flex: 1,
    },
    cardListItemDisabledFamily: {
        flexDirection: 'row',
        gap: 12, // gap-3
        alignItems: 'center',
    },
    cardListItemTextDisabledFamily: {
        fontSize: 14, // text-sm
        color: '#9CA3AF', // text-gray-400
        flex: 1,
    },
    iconText: {
        fontWeight: 'bold',
        width: 24, // Fixed size for alignment
        height: 24,
        textAlign: 'center',
    },
    iconWrapper: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    }
});