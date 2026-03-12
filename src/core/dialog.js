// Bot Multispa — Dialog FSM (Finite State Machine)
// Manages the 10-step conversation flow
const logger = require('./utils/logger');

/**
 * Dialog states (10 steps from the spec)
 */
const STATES = {
    WELCOME: 'welcome',           // Step 1: Greeting + language selection
    LANGUAGE_SELECTED: 'lang',    // Language chosen → show main menu
    MAIN_MENU: 'main_menu',      // Main menu displayed
    CONSULTATION: 'consultation', // Step 3: Equipment consultation & comparison
    INTEREST: 'interest',         // Step 4: Rent or purchase?
    RENT_DETAILS: 'rent_details', // Step 5: Rental details + price estimate
    BUY_DETAILS: 'buy_details',  // Step 6: Purchase details
    DELIVERY: 'delivery',         // Step 7: Delivery info
    CONTACTS: 'contacts',         // Step 8: Collect contact info
    FAREWELL: 'farewell',         // Step 10: Goodbye

    // Sub-states
    EQUIPMENT_BROWSE: 'equipment_browse',
    EQUIPMENT_CATEGORY: 'equipment_category',
    FAQ_VIEW: 'faq_view',
    AWAITING_FILE: 'awaiting_file',
    AWAITING_AREA: 'awaiting_area', // Waiting for area (m²) for price estimate
};

// In-memory session store
const sessions = new Map();

// Session TTL: 24 hours
const SESSION_TTL = 24 * 60 * 60 * 1000;
// Cleanup interval: every hour
const CLEANUP_INTERVAL = 60 * 60 * 1000;

// Periodically clean up expired sessions to prevent memory leaks
const cleanupTimer = setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const [userId, session] of sessions) {
        if (now - session.lastActivity > SESSION_TTL) {
            sessions.delete(userId);
            cleaned++;
        }
    }
    if (cleaned > 0) {
        logger.debug('Session cleanup', { cleaned, remaining: sessions.size });
    }
}, CLEANUP_INTERVAL);

// Don't prevent process exit
if (cleanupTimer.unref) cleanupTimer.unref();

/**
 * Get or create a session for a user
 */
function getSession(userId) {
    if (!sessions.has(userId)) {
        sessions.set(userId, {
            state: STATES.WELCOME,
            data: {},
            lastActivity: Date.now(),
        });
    }
    const session = sessions.get(userId);
    session.lastActivity = Date.now();
    return session;
}

/**
 * Set the state for a user
 */
function setState(userId, state) {
    const session = getSession(userId);
    session.state = state;
    logger.debug('State changed', { userId, state });
}

/**
 * Get current state for a user
 */
function getState(userId) {
    return getSession(userId).state;
}

/**
 * Store data in session
 */
function setData(userId, key, value) {
    const session = getSession(userId);
    session.data[key] = value;
}

/**
 * Get data from session
 */
function getData(userId, key) {
    const session = getSession(userId);
    return session.data[key];
}

/**
 * Get all session data
 */
function getAllData(userId) {
    return getSession(userId).data;
}

/**
 * Reset session to initial state
 */
function resetSession(userId) {
    sessions.set(userId, {
        state: STATES.WELCOME,
        data: {},
        lastActivity: Date.now(),
    });
    logger.debug('Session reset', { userId });
}

/**
 * Check if session is inactive (for timeout)
 */
function isInactive(userId, timeoutMs) {
    const session = sessions.get(userId);
    if (!session) return false;
    return (Date.now() - session.lastActivity) > timeoutMs;
}

module.exports = {
    STATES,
    getSession,
    setState,
    getState,
    setData,
    getData,
    getAllData,
    resetSession,
    isInactive,
};
