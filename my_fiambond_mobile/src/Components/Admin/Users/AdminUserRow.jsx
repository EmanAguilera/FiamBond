import React, { memo } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ActivityIndicator,
    Platform
} from 'react-native';

// Added onTogglePremium to props destructuring
export const AdminUserRow = memo(({ user, badge, rightContent, onTogglePremium }) => { 
    const initials = (user.full_name || user.first_name || "?").substring(0, 2).toUpperCase();
    const isAdmin = user.role === 'admin';
    const isPremium = user.is_premium;
    
    // CHECK PENDING STATUS
    const isPending = user.subscription_status === 'pending_approval';

    // --- AVATAR STYLES (Dynamic) ---
    const getAvatarStyles = () => {
        let style = [styles.avatarBase];

        if (isAdmin) {
            style.push(styles.avatarAdmin);
        } else if (isPremium) {
            style.push(styles.avatarPremium);
        } else if (isPending) {
            style.push(styles.avatarPending);
        } else {
            style.push(styles.avatarDefault);
        }
        return style;
    };
    
    // --- BADGE RENDERER ---
    const renderBadge = (type) => {
        let style = [styles.badgeBase];
        let textStyle = [styles.badgeText];
        let textContent = '';
        let viewStyle = {};

        if (type === 'admin') {
            style.push(styles.badgeAdmin);
            textStyle.push(styles.badgeTextAdmin);
            textContent = 'ADMIN';
        } else if (type === 'company') {
            style.push(styles.badgeCompany);
            textStyle.push(styles.badgeTextCompany);
            textContent = 'COMPANY';
        } else if (type === 'pending') {
            style.push(styles.badgePending);
            textStyle.push(styles.badgeTextPending);
            viewStyle = styles.badgePendingView; // Includes border
            textContent = 'PENDING REVIEW';
        }

        return (
            <View style={[style, viewStyle]}>
                <Text style={textStyle}>{textContent}</Text>
            </View>
        );
    };

    // --- ACTION BUTTON RENDERER ---
    const renderAction = () => {
        if (rightContent) return rightContent; // For Revenue View
        if (isAdmin) return <Text style={styles.superUserText}>Super User</Text>;

        // --- NEW: APPROVE BUTTON ---
        if (isPending) {
            return (
                <View style={styles.pendingActionContainer}>
                    <Text style={styles.pendingRefText}>
                        Ref: {user.payment_ref || 'N/A'}
                    </Text>
                    <TouchableOpacity 
                        // Call togglePremium with isApproval = true (3rd argument)
                        onPress={() => onTogglePremium && onTogglePremium(user.id, false, true)}
                        style={[styles.approveButton, styles.pulseAnimation]}
                    >
                        {/* Placeholder for loading state */}
                        <Text style={styles.approveButtonText}>Approve Payment</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        // Standard Grant/Revoke Button
        const buttonIsPremium = isPremium;
        
        return (
            <TouchableOpacity 
                onPress={() => onTogglePremium && onTogglePremium(user.id, user.is_premium, false)}
                style={[
                    styles.buttonBase,
                    buttonIsPremium ? styles.buttonRevoke : styles.buttonGrant
                ]}
            >
                <Text style={[
                    styles.buttonText,
                    buttonIsPremium ? styles.buttonTextRevoke : styles.buttonTextGrant
                ]}>
                    {buttonIsPremium ? 'Revoke Company' : 'Grant Company'}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[
            styles.rowBase, 
            isPending && styles.rowPendingHighlight
        ]}>
            
            {/* Avatar */}
            <View style={getAvatarStyles()}>
                <Text style={styles.initialsText}>{initials}</Text>
            </View>

            {/* User Info */}
            <View style={styles.userInfoContainer}>
                <Text style={styles.userName} numberOfLines={1}>{user.full_name || user.first_name}</Text>
                <View style={styles.badgeInfoGroup}>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    
                    {/* Explicit Badges */}
                    {isAdmin && renderBadge('admin')}
                    {isPremium && !isAdmin && renderBadge('company')}
                    {/* Pending Badge */}
                    {isPending && renderBadge('pending')}
                </View>
            </View>

            {/* Right Side Action */}
            <View style={styles.actionContainer}>
                {renderAction()}
            </View>
        </View>
    );
});


// --- STYLESHEET ---
const styles = StyleSheet.create({
    // Row Base (flex items-center p-4 border-b last:border-b-0 border-gray-100 hover:bg-gray-50 transition-colors duration-150)
    rowBase: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16, // p-4
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6', // border-gray-100 (subtler border)
        backgroundColor: '#fff', 
    },
    rowPendingHighlight: {
        backgroundColor: 'rgba(255, 247, 237, 0.4)', // bg-amber-50/40
    },

    // Avatar Base (flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm)
    avatarBase: {
        width: 40, 
        height: 40,
        borderRadius: 20, // rounded-full
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16, // ml-4 replaced by marginRight
    },
    initialsText: {
        fontWeight: 'bold',
        fontSize: 14, // text-sm
    },
    // Avatar Colors
    avatarAdmin: { backgroundColor: '#f3e8ff', color: '#6b21a8' }, // bg-purple-100 text-purple-700
    avatarPremium: { backgroundColor: '#fffbe3', color: '#d97706', borderWidth: 2, borderColor: '#fef3c7' }, // bg-amber-100 text-amber-600 ring-2 ring-amber-200
    avatarPending: { backgroundColor: '#fffdf0', color: '#ca8a04', borderWidth: 2, borderColor: '#fcd34d' }, // bg-yellow-100 text-yellow-600 ring-2 ring-yellow-300
    avatarDefault: { backgroundColor: '#e5e7eb', color: '#4b5563' }, // bg-slate-200 text-slate-600

    // User Info (ml-4 flex-grow min-w-0)
    userInfoContainer: {
        flex: 1, // flex-grow
        minWidth: 0, // min-w-0
    },
    userName: {
        fontWeight: '600', // font-semibold
        color: '#1f2937', // text-gray-800
        marginBottom: 2,
    },
    badgeInfoGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // gap-2
        marginTop: 2, // mt-0.5
    },
    userEmail: {
        fontSize: 14, // text-sm
        color: '#6b7280', // text-gray-500
    },

    // Badges (explicitly rendered) (text-[10px] font-bold px-2 py-0.5 rounded-full uppercase)
    badgeBase: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 9999,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    badgeAdmin: { backgroundColor: '#f3e8ff' },
    badgeTextAdmin: { color: '#6b21a8' }, // purple-700
    badgeCompany: { backgroundColor: '#fffbe3' },
    badgeTextCompany: { color: '#b45309' }, // amber-700
    badgePendingView: { borderWidth: 1, borderColor: '#fcd34d' }, // border border-yellow-200
    badgePending: { backgroundColor: '#fefce8' }, // yellow-100
    badgeTextPending: { color: '#a16207' }, // yellow-700

    // Right Side Action (ml-4 flex items-center text-right)
    actionContainer: {
        marginLeft: 16, // ml-4
        alignItems: 'flex-end',
    },
    
    // Super User Text
    superUserText: {
        fontSize: 12, // text-xs
        fontWeight: 'bold',
        color: '#9ca3af', // text-gray-400
    },

    // PENDING ACTION: APPROVE BUTTON
    pendingActionContainer: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 4, // gap-1
    },
    pendingRefText: {
        fontSize: 10, // text-[10px]
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', // font-mono
        backgroundColor: '#f3f4f6', // bg-gray-100
        paddingHorizontal: 4, // px-1
        borderWidth: 1,
        borderColor: '#e5e7eb', // border
        borderRadius: 4,
        color: '#6b7280', // text-gray-500
    },
    approveButton: {
        paddingHorizontal: 12, // px-3
        paddingVertical: 6, // py-1.5
        borderRadius: 4,
        borderWidth: 1,
        backgroundColor: '#059669', // bg-emerald-600
        borderColor: '#059669', // border-emerald-600
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3, // shadow-md
    },
    approveButtonText: {
        fontSize: 12, // text-xs
        fontWeight: 'bold',
        color: '#fff', // text-white
    },
    // The web's 'animate-pulse' needs a specific library in RN (e.g., react-native-reanimated)
    // For a static conversion, the style is left out, but the class name is mapped above.
    pulseAnimation: { 
        // Implement pulse animation here using Animated or Reanimated
    },

    // STANDARD GRANT/REVOKE BUTTON
    buttonBase: {
        paddingHorizontal: 12, // px-3
        paddingVertical: 6, // py-1.5
        borderRadius: 4,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1, // shadow-sm
    },
    buttonText: {
        fontSize: 12, // text-xs
        fontWeight: 'bold',
    },
    // Revoke (isPremium true)
    buttonRevoke: {
        backgroundColor: '#fff',
        borderColor: '#fecaca', // red-200
    },
    buttonTextRevoke: {
        color: '#dc2626', // red-600
    },
    // Grant (isPremium false)
    buttonGrant: {
        backgroundColor: '#4f46e5', // indigo-600
        borderColor: '#4f46e5',
    },
    buttonTextGrant: {
        color: '#fff', // text-white
    },
});