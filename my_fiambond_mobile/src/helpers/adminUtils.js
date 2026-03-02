'use client';

/**
 * Normalizes different date formats (Firebase Timestamps or ISO strings) 
 * into standard JavaScript Date objects.
 */
export const parseDate = (dateVal) => {
    if (!dateVal) return null;
    
    // Handle Firebase Timestamp { seconds, nanoseconds }
    if (dateVal.seconds) {
        return new Date(dateVal.seconds * 1000);
    }
    
    const parsed = new Date(dateVal);
    return isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Calculates the expiration date based on the plan type.
 * Includes a 'testMode' to speed up expiration for debugging on mobile devices.
 */
export const getExpirationDetails = (rawDate, plan, testMode = false) => {
    const start = parseDate(rawDate);
    if (!start) return null;

    const end = new Date(start);

    if (testMode) {
        // Fast expiration for testing: 1 min for monthly, 5 mins for yearly
        plan === 'yearly' 
            ? end.setMinutes(end.getMinutes() + 5) 
            : end.setMinutes(end.getMinutes() + 1);
    } else {
        // Standard expiration: 1 month or 1 year
        plan === 'yearly' 
            ? end.setFullYear(end.getFullYear() + 1) 
            : end.setMonth(end.getMonth() + 1);
    }
    return end;
};

/**
 * Returns a human-readable countdown string.
 * Optimized for mobile display (shorter strings).
 */
export const calculateTimeLeft = (endDate) => {
    if (!endDate) return { expired: true, text: "N/A" };
    
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();

    if (diff <= 0) {
        return { expired: true, text: "EXPIRED" };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
        return { expired: false, text: `${days}d ${hours}h left` };
    }
    
    // For counts under a day, show minutes and seconds
    return { expired: false, text: `${mins}m ${secs}s` };
};