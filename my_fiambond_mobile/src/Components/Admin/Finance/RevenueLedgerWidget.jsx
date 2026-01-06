import React, { memo, useMemo } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    Dimensions 
} from 'react-native';
// NOTE: Ensure your AdminUserRow component is a React Native component
import { AdminUserRow } from '../Users/AdminUserRow'; 

const windowHeight = Dimensions.get('window').height;

const RevenueLedgerWidget = ({ premiums, users, currentAdminId }) => {

    const getAllTransactions = () => {
        // Build the ledger from the premiums collection (History)
        return premiums
            .filter(p => p.user_id !== currentAdminId) // Exclude admin's own tests
            .map(p => {
                // Find the user object associated with this premium record
                const userData = users.find(u => u.id === p.user_id) || { 
                    full_name: "Unknown User", 
                    email: "deleted@user.com" 
                };

                const dateVal = p.granted_at;
                const dateStr = dateVal?.seconds 
                    ? new Date(dateVal.seconds * 1000).toLocaleDateString() 
                    : 'Unknown Date';

                const badgeTheme = p.access_type === 'family' ? 'blue' : 'emerald';
                const colorKey = badgeTheme === 'emerald' ? 'emerald' : 'indigo'; // Maps to RN styles

                return {
                    uniqueId: p.id,
                    user: userData,
                    type: (p.access_type || 'COMPANY').toUpperCase(),
                    plan: (p.plan_cycle || 'MONTHLY').toUpperCase(),
                    price: p.amount || 0,
                    date: dateStr,
                    colorKey: colorKey, // Used to select price text color style
                    badgeTheme: badgeTheme, // Used to select badge color styles
                    timestamp: dateVal?.seconds || 0
                };
            })
            // Sort by most recent transaction first
            .sort((a, b) => b.timestamp - a.timestamp);
    };

    // Use useMemo to prevent recalculating transactions on every render if props haven't changed
    const transactions = useMemo(getAllTransactions, [premiums, users, currentAdminId]);
    
    // Style helper functions
    const getPriceColorStyle = (colorKey) => {
        return colorKey === 'emerald' ? styles.priceTextEmerald : styles.priceTextIndigo;
    };
    const getBadgeStyle = (badgeTheme) => {
        return badgeTheme === 'emerald' ? styles.badgeEmerald : styles.badgeIndigo;
    };
    const getBadgeTextStyle = (badgeTheme) => {
        return badgeTheme === 'emerald' ? styles.badgeTextEmerald : styles.badgeTextIndigo;
    };


    return (
        <View style={styles.container}>
            {/* max-h-[60vh] overflow-y-auto pr-2 */}
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
            >
                {transactions.length > 0 ? (
                    <View style={styles.listContainer}>
                        {transactions.map(item => (
                            <AdminUserRow 
                                key={item.uniqueId} 
                                user={item.user}
                                // We override the buttons to show the price instead
                                rightContent={
                                    <View style={styles.rightContentStyle}>
                                        {/* + ₱{item.price.toLocaleString()} */}
                                        <Text style={[styles.priceTextBase, getPriceColorStyle(item.colorKey)]}>
                                            + ₱{item.price.toLocaleString('en-US')}
                                        </Text>
                                        
                                        <View style={styles.badgeInfoContainer}>
                                            {/* Badge: {item.type} • {item.plan} */}
                                            <View style={[styles.badgeBase, getBadgeStyle(item.badgeTheme)]}>
                                                <Text style={[styles.badgeTextSmall, getBadgeTextStyle(item.badgeTheme)]}>
                                                    {item.type} • {item.plan}
                                                </Text>
                                            </View>
                                            
                                            {/* Date: {item.date} */}
                                            <Text style={styles.dateText}>
                                                {item.date}
                                            </Text>
                                        </View>
                                    </View>
                                }
                            />
                        ))}
                    </View>
                ) : (
                    <View style={styles.noDataContainer}>
                        <Text style={styles.noDataText}>No revenue transactions recorded yet.</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

export default memo(RevenueLedgerWidget);

// --- STYLESHEET (Mapping Tailwind to React Native) ---
const styles = StyleSheet.create({
    container: {
        maxHeight: windowHeight * 0.60, // max-h-[60vh]
        overflow: 'hidden',
        backgroundColor: '#fff',
        borderRadius: 8,
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        paddingRight: 8, // pr-2
    },
    listContainer: {
        flexDirection: 'column',
        gap: 8, // gap-2
    },

    // Transaction/Price Display (flex flex-col items-end min-w-[100px])
    rightContentStyle: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        minWidth: 100,
    },
    
    // Price Text (font-bold text-lg tracking-tight)
    priceTextBase: {
        fontWeight: 'bold',
        fontSize: 18, // text-lg
        letterSpacing: -0.5, // tracking-tight
    },
    priceTextEmerald: {
        color: '#059669', // text-emerald-600
    },
    priceTextIndigo: {
        color: '#4f46e5', // text-indigo-600
    },

    // Badge and Date Info (flex items-center gap-2 mt-1 opacity-90)
    badgeInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // gap-2
        marginTop: 4, // mt-1
        opacity: 0.9,
    },

    // Badge Base (border px-1.5 py-0.5 rounded uppercase)
    badgeBase: {
        borderWidth: 1,
        paddingHorizontal: 6, // px-1.5
        paddingVertical: 2, // py-0.5
        borderRadius: 4, 
        textTransform: 'uppercase',
    },
    badgeTextSmall: {
        fontSize: 10, // text-[10px]
        fontWeight: 'bold',
        letterSpacing: 0.5, // tracking-wider
    },
    
    // Emerald Badge (bg-emerald-50 text-emerald-700 border-emerald-200)
    badgeEmerald: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
    badgeTextEmerald: { color: '#047857' },
    
    // Indigo Badge (bg-indigo-50 text-indigo-700 border-indigo-200)
    badgeIndigo: { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' },
    badgeTextIndigo: { color: '#4338ca' },

    // Date Text (text-[10px] text-slate-400 font-medium)
    dateText: {
        fontSize: 10,
        color: '#94a3b8', // text-slate-400
        fontWeight: '500', // font-medium
    },

    // No Data State (flex flex-col items-center justify-center py-12 text-center)
    noDataContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48, // py-12
        textAlign: 'center',
    },
    noDataText: {
        color: '#94a3b8', // text-slate-400
        fontStyle: 'italic', // italic
        fontSize: 14, // text-sm
    }
});