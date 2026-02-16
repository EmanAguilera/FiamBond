// src/helpers/adminUtils.js

export const parseDate = (dateVal) => {
    if (!dateVal) return null;
    return dateVal.seconds ? new Date(dateVal.seconds * 1000) : new Date(dateVal);
};

export const getExpirationDetails = (rawDate, plan, testMode = false) => {
    const start = parseDate(rawDate);
    if (!start || isNaN(start.getTime())) return null;
    const end = new Date(start);
    if (testMode) {
        plan === 'yearly' ? end.setMinutes(end.getMinutes() + 5) : end.setMinutes(end.getMinutes() + 1);
    } else {
        plan === 'yearly' ? end.setFullYear(end.getFullYear() + 1) : end.setMonth(end.getMonth() + 1);
    }
    return end;
};

export const calculateTimeLeft = (endDate) => {
    const diff = endDate - new Date();
    if (diff <= 0) return { expired: true, text: "EXPIRED" };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return { expired: false, text: `${days}d ${hours}h left` };
    return { expired: false, text: `${mins}m ${secs}s` };
};