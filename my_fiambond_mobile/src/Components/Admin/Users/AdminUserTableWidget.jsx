import React, { memo, useEffect, useState, useMemo } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    Platform, 
    Alert,
    Dimensions 
} from 'react-native';

// --- CONFIGURATION ---
// TRUE  = 1 Minute Expiry (For Testing)
// FALSE = 30 Days / 1 Year Expiry (For Production)
const TEST_MODE = false; 

// Get screen height for max-h-[60vh] calculation
const windowHeight = Dimensions.get('window').height;

// --- ICONS (Converted to basic RN View/Text for simplicity) ---
// You should replace these with proper react-native-svg icons
const IconBase = ({ text, style }) => <Text style={[{ fontSize: 12 }, style]}>{text}</Text>;
const CheckIcon = (props) => <IconBase text="✓" style={{ fontWeight: 'bold' }} {...props} />;
const ClockIcon = (props) => <IconBase text="🕓" {...props} />;

// --- HELPER: ROBUST DATE PARSER (MongoDB + Firebase) ---
const parseDate = (dateVal) => {
    if (!dateVal) return null;
    if (dateVal.seconds) return new Date(dateVal.seconds * 1000);
    return new Date(dateVal);
};

// --- HELPER: CALCULATE EXPIRY ---
const getExpirationDetails = (rawDate, plan) => {
    const start = parseDate(rawDate);
    if (!start || isNaN(start.getTime())) return null;

    const end = new Date(start);

    if (TEST_MODE) {
        if (plan === 'yearly') end.setMinutes(end.getMinutes() + 5);
        else end.setMinutes(end.getMinutes() + 1);
    } else {
        if (plan === 'yearly') end.setFullYear(end.getFullYear() + 1);
        else end.setMonth(end.getMonth() + 1);
    }

    return end;
};

// --- COMPONENT: REAL-TIME SUBSCRIPTION TICKER ---
const SubscriptionTicker = memo(({ label, type, user, onRevoke }) => {
    const isPremium = type === 'company' ? user.is_premium : user.is_family_premium;
    const grantedAt = type === 'company' ? user.premium_granted_at : user.family_premium_granted_at;
    const plan = type === 'company' ? user.premium_plan : user.family_premium_plan;
    
    const startDate = parseDate(grantedAt);
    const endDate = getExpirationDetails(grantedAt, plan || 'monthly');
    
    const [timeLeft, setTimeLeft] = useState('Calculating...');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!isPremium || !endDate) return;

        const interval = setInterval(() => {
            const now = new Date();
            const diff = endDate - now;

            if (diff <= 0) {
                if (!isExpired) {
                    setIsExpired(true);
                    setTimeLeft("EXPIRED");
                    clearInterval(interval);
                    
                    // Auto-revoke trigger (onRevoke is used here, assuming stability/memoization outside)
                    console.log(`Auto-revoking ${type} for ${user.email}`);
                    onRevoke(user.id, 'revoke', type);
                }
            } else {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                if (TEST_MODE) {
                    setTimeLeft(`${minutes}m ${seconds}s`);
                } else {
                    if (days > 1) setTimeLeft(`${days} days left`);
                    else setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
                }
            }
        }, 1000);

        // Cleanup: Use the function returned by setInterval directly for clearing
        return () => clearInterval(interval);
    }, [endDate, isPremium, user.id, type, isExpired, user.email, onRevoke]); // onRevoke added for correctness, but note potential stability issues

    if (!isPremium || !startDate) return null;

    const theme = type === 'company' ? styles.tickerThemeCompany : styles.tickerThemeFamily;
    
    const startStr = startDate.toLocaleDateString(); 
    const endStr = endDate.toLocaleString([], { 
        year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    return (
        <View style={[styles.tickerBase, theme]}>
            {/* Header: Label + Countdown */}
            <View style={styles.tickerHeader}>
                <Text style={styles.tickerLabel}>{label.toUpperCase()}</Text>
                <View style={styles.tickerCountdown}>
                    <ClockIcon />
                    <Text style={[styles.tickerTimeLeft, isExpired ? styles.tickerTimeExpired : styles.tickerTimeActive]}>
                        {timeLeft}
                    </Text>
                </View>
            </View>

            {/* Body: Start & End Dates */}
            <View style={styles.tickerDateGroup}>
                <View>
                    <Text style={styles.tickerDateLabel}>Start Date</Text>
                    <Text style={styles.tickerDateValue}>{startStr}</Text>
                </View>
                <View style={styles.tickerDateRight}>
                    <Text style={styles.tickerDateLabel}>End Date</Text>
                    <Text style={styles.tickerDateValueBold}>{endStr}</Text>
                </View>
            </View>
        </View>
    );
});

// --- ROW COMPONENT ---
export const AdminUserRow = memo(({ user, rightContent, onTogglePremium }) => {
    const initials = (user.full_name || user.first_name || "?").substring(0, 2).toUpperCase();
    const isAdmin = user.role === 'admin';
    
    const isCompanyPremium = user.is_premium;
    const isCompanyPending = user.subscription_status === 'pending_approval';
    const isFamilyPremium = user.is_family_premium;
    const isFamilyPending = user.family_subscription_status === 'pending_approval';

    // --- Dynamic Row Styling ---
    const rowStyles = useMemo(() => {
        let borderStyle = styles.rowBorderDefault;
        let bgStyle = styles.rowBgDefault;

        if (rightContent) {
            borderStyle = styles.rowBorderRevenue;
            bgStyle = styles.rowBgRevenue;
        } else if (isAdmin) {
            borderStyle = styles.rowBorderAdmin;
            bgStyle = styles.rowBgAdmin;
        } else if (isCompanyPending || isFamilyPending) {
            borderStyle = styles.rowBorderPending;
            bgStyle = styles.rowBgPending;
        } else if (isCompanyPremium || isFamilyPremium) {
            borderStyle = styles.rowBorderPremium;
        }

        return [styles.rowBase, borderStyle, bgStyle];
    }, [isAdmin, isCompanyPremium, isFamilyPremium, isCompanyPending, isFamilyPending, rightContent]);
    
    // --- Dynamic Avatar Styling ---
    const avatarStyles = useMemo(() => {
        if (isAdmin) return styles.avatarAdmin;
        if (isCompanyPending || isFamilyPending) return styles.avatarPending;
        if (isCompanyPremium || isFamilyPremium) return styles.avatarPremium;
        return styles.avatarDefault;
    }, [isAdmin, isCompanyPremium, isFamilyPremium, isCompanyPending, isFamilyPending]);


    const approvalButtons = (type, label) => (
        <View style={styles.approvalButtonsContainer}>
            <TouchableOpacity onPress={() => onTogglePremium(user.id, 'approve', type)} style={styles.approveButton}>
                <CheckIcon style={styles.approveButtonIcon} /> 
                <Text style={styles.approveButtonText}>{label}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                onPress={() => { 
                    Alert.alert(
                        "Confirm Rejection", 
                        "Are you sure you want to reject this payment request?", 
                        [
                            { text: "Cancel", style: "cancel" },
                            { text: "Reject", style: "destructive", onPress: () => onTogglePremium(user.id, 'reject', type) }
                        ]
                    );
                }} 
                style={styles.rejectButton}
            >
                <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
        </View>
    );

    const renderAction = () => {
        if (rightContent) return rightContent;
        if (isCompanyPending) return approvalButtons('company', 'Approve Company');
        if (isFamilyPending) return approvalButtons('family', 'Approve Family');
        if (isAdmin) return <Text style={styles.adminActionText}>SYSTEM ADMIN</Text>;

        return (
            <View style={styles.grantRevokeContainer}>
                <TouchableOpacity 
                    onPress={() => onTogglePremium(user.id, isCompanyPremium ? 'revoke' : 'grant', 'company')}
                    style={[
                        styles.grantRevokeButtonBase,
                        styles.grantRevokeButtonSize,
                        isCompanyPremium ? styles.buttonRevokeCo : styles.buttonGrantCo
                    ]}
                >
                    <Text style={[styles.grantRevokeText, isCompanyPremium ? styles.textRevoke : styles.textGrantCo]}>
                        {isCompanyPremium ? 'Revoke Co.' : '+ Grant Co.'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => onTogglePremium(user.id, isFamilyPremium ? 'revoke' : 'grant', 'family')}
                    style={[
                        styles.grantRevokeButtonBase,
                        styles.grantRevokeButtonSize,
                        isFamilyPremium ? styles.buttonRevokeFam : styles.buttonGrantFam
                    ]}
                >
                    <Text style={[styles.grantRevokeText, isFamilyPremium ? styles.textRevoke : styles.textGrantFam]}>
                        {isFamilyPremium ? 'Revoke Fam.' : '+ Grant Fam.'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={rowStyles}>
            <View style={styles.infoWrapper}>
                {/* Avatar */}
                <View style={[styles.avatarBase, avatarStyles]}>
                    <Text style={styles.initialsText}>{initials}</Text>
                </View>
                
                {/* User Info & Tickers */}
                <View style={styles.detailWrapper}>
                    <View style={styles.nameBadgeGroup}>
                        <Text style={styles.userNameText}>{user.full_name || user.first_name || "Unknown User"}</Text>
                        {isAdmin && <Text style={styles.adminBadge}>Admin</Text>}
                    </View>
                    <Text style={styles.userEmailText}>{user.email}</Text>

                    {/* Tickers / Pending Statuses */}
                    <View>
                        {isCompanyPremium && !rightContent && <SubscriptionTicker label="Company Plan" type="company" user={user} onRevoke={onTogglePremium} />}
                        {isFamilyPremium && !rightContent && <SubscriptionTicker label="Family Plan" type="family" user={user} onRevoke={onTogglePremium} />}
                        
                        {isCompanyPending && !rightContent && <View style={styles.pendingStatusBox}><Text style={styles.pendingStatusText}>Pending Company Approval</Text></View>}
                        {isFamilyPending && !rightContent && <View style={styles.pendingStatusBox}><Text style={styles.pendingStatusText}>Pending Family Approval</Text></View>}
                    </View>
                </View>
            </View>
            
            {/* Action */}
            <View style={styles.actionWrapper}>{renderAction()}</View>
        </View>
    );
});

// --- MAIN TABLE WIDGET ---
const AdminUserTableWidget = ({ users, type, onTogglePremium, headerText }) => {

    // Memoize the mapping logic
    const tableRows = useMemo(() => {
        if (!users || users.length === 0) return null;

        return users.map(u => {
            let customRight = undefined;
            if (type === 'revenue') {
                const plan = u.premium_plan || 'monthly';
                const amount = plan === 'yearly' ? 15000 : 1500;
                const dateObj = parseDate(u.premium_granted_at);
                const dateStr = dateObj ? dateObj.toLocaleDateString() : '-';
                
                customRight = (
                    <View style={styles.revenueRightContent}>
                        <Text style={styles.revenueAmountText}>+ ₱{amount.toLocaleString()}</Text>
                        <Text style={styles.revenueDateText}>{dateStr}</Text>
                    </View>
                );
            }
            return <AdminUserRow key={u.id} user={u} rightContent={customRight} onTogglePremium={onTogglePremium} />;
        });
    }, [users, type, onTogglePremium]);
    
    // Header styling is complex due to 'sticky top-0 z-10 backdrop-blur-md'
    const headerStyle = useMemo(() => {
        return [
            styles.tableHeaderBase,
            type === 'revenue' ? styles.tableHeaderRevenue : styles.tableHeaderDefault
        ];
    }, [type]);

    return (
        <View style={styles.tableWidgetContainer}>
            {headerText && (
                <View style={headerStyle}>
                    <Text style={styles.tableHeaderText}>{headerText}</Text>
                </View>
            )}
            <ScrollView style={styles.tableScrollView}>
                {tableRows ? tableRows : (
                    <View style={styles.noRecords}><Text style={styles.noRecordsText}>No records found</Text></View>
                )}
            </ScrollView>
        </View>
    );
};

export default memo(AdminUserTableWidget);

// --- STYLESHEET (Mappings for ALL components) ---
const styles = StyleSheet.create({
    // --- AdminUserTableWidget Styles ---
    tableWidgetContainer: {
        backgroundColor: '#fff',
        borderRadius: 12, // rounded-xl
        borderWidth: 1,
        borderColor: '#e5e7eb', // border-gray-200
        overflow: 'hidden',
        flexDirection: 'column',
        height: '100%',
        maxHeight: windowHeight * 0.60, // max-h-[60vh]
    },
    tableHeaderBase: {
        paddingHorizontal: 20, // px-5
        paddingVertical: 12, // py-3
        borderBottomWidth: 1,
        zIndex: 10,
        // The web's 'sticky top-0 z-10 backdrop-blur-md' is approximated by position: absolute or simply by being the first child
        position: 'absolute', // Make it sticky by using absolute positioning
        top: 0,
        left: 0,
        right: 0,
    },
    tableHeaderDefault: { 
        backgroundColor: 'rgba(249, 250, 251, 0.9)', // bg-slate-50/90
        borderColor: '#e2e8f0', // border-slate-200
    },
    tableHeaderRevenue: {
        backgroundColor: 'rgba(236, 253, 245, 0.9)', // bg-emerald-50/90
        borderColor: '#d1fae5', // border-emerald-100
    },
    tableHeaderText: {
        fontSize: 12, // text-xs
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5, // tracking-wider
        color: '#475569', // text-slate-600 (default) or #065f46 (emerald-800 for revenue)
    },
    tableScrollView: {
        flexGrow: 1,
        paddingTop: 44, // Add padding to offset the absolute header (approx header height)
    },
    noRecords: { padding: 32, alignItems: 'center' },
    noRecordsText: { fontSize: 14, color: '#9ca3af' },

    // Revenue Right Content Styles (Used in AdminUserTableWidget)
    revenueRightContent: { flexDirection: 'column', alignItems: 'flex-end' },
    revenueAmountText: { fontWeight: 'bold', color: '#059669', fontSize: 14 },
    revenueDateText: { fontSize: 10, color: '#94a3b8' },


    // --- AdminUserRow Styles ---
    rowBase: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        borderLeftWidth: 4,
    },
    // Left border colors (border-l-[4px])
    rowBorderDefault: { borderColor: 'transparent' },
    rowBorderRevenue: { borderColor: '#d1fae5' }, 
    rowBorderAdmin: { borderColor: '#a855f7' }, 
    rowBorderPending: { borderColor: '#f59e0b' }, 
    rowBorderPremium: { borderColor: '#10b981' }, 
    // Background colors
    rowBgDefault: { backgroundColor: '#fff' },
    rowBgRevenue: { backgroundColor: 'rgba(236, 253, 245, 0.3)' }, 
    rowBgAdmin: { backgroundColor: 'rgba(243, 232, 255, 0.3)' }, 
    rowBgPending: { backgroundColor: 'rgba(255, 247, 237, 0.4)' }, 
    
    // Avatar
    avatarBase: {
        flexShrink: 0, width: 48, height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1, elevation: 1,
    },
    initialsText: { fontWeight: 'bold', fontSize: 18 },
    avatarAdmin: { backgroundColor: '#f3e8ff', color: '#6b21a8' }, 
    avatarPremium: { backgroundColor: '#ecfdf5', color: '#059669' }, 
    avatarPending: { backgroundColor: '#fffbe3', color: '#d97706' }, 
    avatarDefault: { backgroundColor: '#e2e8f0', color: '#64748b' }, 

    // User Details
    infoWrapper: { flexDirection: 'row', flexGrow: 1, alignItems: 'flex-start' },
    detailWrapper: { flexDirection: 'column', justifyContent: 'center', flex: 1, maxWidth: 300 }, // max-w-md
    nameBadgeGroup: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    userNameText: { fontWeight: 'bold', color: '#1e293b', fontSize: 14 },
    adminBadge: { backgroundColor: '#f3e8ff', color: '#6b21a8', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999, textTransform: 'uppercase' },
    userEmailText: { fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 4 },
    pendingStatusBox: { marginTop: 8, backgroundColor: '#fffbe3', padding: 8, borderRadius: 4, borderWidth: 1, borderColor: '#fde68a' },
    pendingStatusText: { fontSize: 12, color: '#d97706', fontWeight: 'bold' },

    // Action Wrapper
    actionWrapper: { marginTop: 16, marginLeft: 16, alignItems: 'flex-end', justifyContent: 'flex-start' },
    adminActionText: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, letterSpacing: 0.5 },

    // Grant/Revoke Buttons
    grantRevokeContainer: { flexDirection: 'column', gap: 8, alignItems: 'flex-end' },
    grantRevokeButtonBase: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, },
    grantRevokeButtonSize: { width: 112, alignItems: 'center' },
    grantRevokeText: { fontSize: 12, fontWeight: 'bold' },
    textRevoke: { color: '#e11d48' }, 
    buttonRevokeCo: { backgroundColor: '#fff', borderColor: '#fecaca' },
    buttonRevokeFam: { backgroundColor: '#fff', borderColor: '#fecaca' },
    buttonGrantCo: { backgroundColor: '#fff', borderColor: '#e2e8f0' },
    textGrantCo: { color: '#64748b' }, 
    buttonGrantFam: { backgroundColor: '#fff', borderColor: '#e2e8f0' },
    textGrantFam: { color: '#64748b' },

    // Approval Buttons
    approvalButtonsContainer: { flexDirection: 'column', alignItems: 'flex-end', gap: 8 },
    approveButton: {
        flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#059669', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3,
    },
    approveButtonIcon: { color: '#fff', fontWeight: 'bold', marginRight: -4, fontSize: 16 },
    approveButtonText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
    rejectButton: { paddingHorizontal: 8 },
    rejectButtonText: { fontSize: 12, color: '#f43f5e', fontWeight: '500' },

    // --- SubscriptionTicker Styles ---
    tickerBase: { marginTop: 8, fontSize: 10, padding: 8, borderRadius: 8, borderWidth: 1, flexDirection: 'column', gap: 4, width: '100%' },
    tickerThemeCompany: { backgroundColor: '#ecfdf5', borderColor: '#d1fae5' }, 
    tickerThemeFamily: { backgroundColor: '#eff6ff', borderColor: '#dbeafe' }, 
    tickerHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', paddingBottom: 4, marginBottom: 4,
    },
    tickerLabel: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 'bold', fontSize: 10 },
    tickerCountdown: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    tickerTimeLeft: { fontWeight: '400', fontSize: 12 },
    tickerTimeActive: { color: '#475569' }, 
    tickerTimeExpired: { color: '#dc2626', fontWeight: 'bold' }, 
    tickerDateGroup: { flexDirection: 'row', justifyContent: 'space-between', gap: 24 },
    tickerDateLabel: { color: '#9ca3af', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
    tickerDateValue: { fontSize: 12, fontWeight: '500' },
    tickerDateValueBold: { fontSize: 12, fontWeight: 'bold' },
    tickerDateRight: { alignItems: 'flex-end' },
});