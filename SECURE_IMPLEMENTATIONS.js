/**
 * SECURE IMPLEMENTATION EXAMPLE
 * 
 * This file demonstrates secure versions of the vulnerable code from PR #11.
 * Use these implementations as reference when creating the secure version.
 */

// ============================================================================
// SECURE: Input Validation and Sanitization
// ============================================================================

/**
 * Validates that input contains only safe characters for room/user names
 * @param {string} input - User input to validate
 * @param {string} fieldName - Name of field for error message
 * @returns {boolean} - True if valid, false otherwise
 */
function validateInput(input, fieldName) {
    // Only allow alphanumeric characters, hyphens, and underscores
    const pattern = /^[a-zA-Z0-9_-]{3,20}$/;
    
    if (!pattern.test(input)) {
        alert(`Invalid ${fieldName}. Use only letters, numbers, hyphens, or underscores (3-20 characters)`);
        return false;
    }
    
    // Additional check: ensure input doesn't contain path traversal attempts
    if (input.includes('..') || input.includes('/') || input.includes('\\')) {
        alert(`Invalid ${fieldName}. Special characters not allowed.`);
        return false;
    }
    
    return true;
}

/**
 * Sanitizes a string for display (prevents XSS)
 * Note: In React, prefer using {value} instead of dangerouslySetInnerHTML
 * @param {string} input - String to sanitize
 * @returns {string} - Sanitized string
 */
function sanitizeForDisplay(input) {
    if (typeof input !== 'string') {
        return String(input);
    }
    
    // Escape HTML special characters
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

// ============================================================================
// SECURE: Number Input Processing (replaces eval())
// ============================================================================

/**
 * SECURE version of submitNumber()
 * Properly validates numeric input without using eval()
 */
async function submitNumber_SECURE(numRef, roomID, uname, setHasSubmitted) {
    const db = getDatabase();
    const reff = ref(db, "numrooms/" + roomID + "/unamesnum");
    
    // Get and validate input
    const enteredValue = numRef.current.value.trim();
    
    // Parse as integer - NEVER use eval()
    const enteredNum = parseInt(enteredValue, 10);
    
    // Strict validation
    if (isNaN(enteredNum)) {
        alert("Please enter a valid number");
        return;
    }
    
    // Optional: Add range validation
    if (enteredNum < 0 || enteredNum > 9999) {
        alert("Please enter a number between 0 and 9999");
        return;
    }

    try {
        const snapshot = await get(reff);
        if (snapshot.exists()) {
            let temp = snapshot.val();
            
            // Find and update the current user's number
            for (let i = 0; i < temp.length; i++) {
                if (temp[i].uname === uname) {
                    temp[i].num = enteredNum;
                    break;
                }
            }
            
            await set(reff, temp);
            setHasSubmitted(true);
        }
    } catch (error) {
        // Log error for debugging (server-side in production)
        console.error('Error submitting number:', error);
        
        // Show generic error to user (don't expose internals)
        alert("An error occurred. Please try again.");
    }
}

// ============================================================================
// SECURE: Object Cloning (replaces vulnerable merge function)
// ============================================================================

/**
 * SECURE version of cloneObject()
 * Uses built-in structuredClone or safe JSON method
 */
function cloneObject_SECURE(obj) {
    // Option 1: Use modern structuredClone (best option)
    if (typeof structuredClone !== 'undefined') {
        return structuredClone(obj);
    }
    
    // Option 2: JSON parse/stringify (safe but has limitations)
    // Note: This won't copy functions, undefined, symbols, etc.
    try {
        return JSON.parse(JSON.stringify(obj));
    } catch (error) {
        console.error('Error cloning object:', error);
        return null;
    }
}

/**
 * Alternative: Manual deep clone with prototype protection
 */
function deepClone_SECURE(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => deepClone_SECURE(item));
    }
    
    const cloned = {};
    for (const key in obj) {
        // CRITICAL: Check hasOwnProperty to prevent prototype pollution
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            // CRITICAL: Prevent __proto__ and constructor manipulation
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                continue;
            }
            cloned[key] = deepClone_SECURE(obj[key]);
        }
    }
    
    return cloned;
}

// ============================================================================
// SECURE: Take Back Function
// ============================================================================

async function takeBack_SECURE(roomID, uname, setHasSubmitted) {
    const db = getDatabase();
    const reff = ref(db, "numrooms/" + roomID + "/unamesnum");
    
    try {
        const snapshot = await get(reff);
        if (snapshot.exists()) {
            let temp = snapshot.val();
            
            // SECURE: Use safe cloning
            temp = temp.map(player => cloneObject_SECURE(player));
            
            // Reset the user's number
            for (let i = 0; i < temp.length; i++) {
                if (temp[i].uname === uname) {
                    temp[i].num = 0;
                    break;
                }
            }
            
            await set(reff, temp);
            setHasSubmitted(false);
        }
    } catch (error) {
        console.error('Error taking back number:', error);
        alert("An error occurred. Please try again.");
    }
}

// ============================================================================
// SECURE: React Component Rendering (prevents XSS)
// ============================================================================

/**
 * SECURE version of player list rendering
 * Uses React's built-in escaping instead of dangerouslySetInnerHTML
 */
function renderPlayerNames_SECURE(playerNames, winner, allSubmitted, currentUserName) {
    return playerNames.map((item, idx) => (
        <p 
            key={idx} 
            style={{
                fontWeight: winner && winner.uname === item.uname ? 'bold' : 'normal'
            }}
        >
            {/* React automatically escapes these values - NO XSS RISK */}
            {item.uname}: {allSubmitted || item.uname === currentUserName ? item.num : (item.num === 0 ? '?' : '✓')}
            {winner && winner.uname === item.uname && ' 🏆'}
        </p>
    ));
}

// ============================================================================
// SECURE: Join Room with Validation
// ============================================================================

/**
 * SECURE version of joinRoom()
 * Validates inputs before navigation
 */
function joinRoom_SECURE(roomRef, nameRef, navigate) {
    const room = roomRef.current.value.trim();
    const name = nameRef.current.value.trim();
    
    // Validate both inputs
    if (!validateInput(room, 'room name')) {
        return;
    }
    
    if (!validateInput(name, 'username')) {
        return;
    }
    
    // Navigate with validated inputs
    navigate('/gubs/' + room + '/' + name);
}

/**
 * SECURE version of joinNumber()
 * Validates inputs before creating number room
 */
async function joinNumber_SECURE(nameRef, roomRef, createNumRoom, navigate) {
    const name = nameRef.current.value.trim();
    const room = roomRef.current.value.trim();
    
    // Validate inputs
    if (!validateInput(name, 'username')) {
        return;
    }
    
    if (!validateInput(room, 'room name')) {
        return;
    }
    
    try {
        const success = await createNumRoom(name, room);
        if (success) {
            navigate('/numbers/' + room + '/' + name);
        } else {
            alert("Username already taken. Please choose a different one.");
        }
    } catch (error) {
        console.error('Error joining room:', error);
        alert("An error occurred. Please try again.");
    }
}

// ============================================================================
// SECURE: Error Handling
// ============================================================================

/**
 * SECURE error handler that logs details but shows generic messages to users
 */
function handleError_SECURE(error, userMessage = "An error occurred. Please try again.") {
    // Log full error for debugging (in production, send to monitoring service)
    console.error('Application error:', error);
    
    // In production, send to error tracking service:
    // if (process.env.NODE_ENV === 'production') {
    //     errorTrackingService.log(error);
    // }
    
    // Show generic message to user (don't expose internals)
    alert(userMessage);
}

// ============================================================================
// SECURE: Admin Functions
// ============================================================================

/**
 * Admin operations should NEVER be in client-side code.
 * This is an example of how to properly implement admin functions:
 * 
 * 1. Create a Firebase Cloud Function (server-side)
 * 2. Protect with Firebase Authentication
 * 3. Use Firebase Security Rules to verify admin role
 * 4. Call from client using httpsCallable
 */

/**
 * Example Firebase Cloud Function (deploy to Firebase):
 * 
 * exports.resetAllRooms = functions.https.onCall(async (data, context) => {
 *     // Verify user is authenticated
 *     if (!context.auth) {
 *         throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
 *     }
 *     
 *     // Verify user has admin role (set via Admin SDK)
 *     if (!context.auth.token.admin) {
 *         throw new functions.https.HttpsError('permission-denied', 'User does not have admin privileges');
 *     }
 *     
 *     // Perform admin operation
 *     const db = admin.database();
 *     await db.ref('numrooms').remove();
 *     
 *     return { success: true, message: 'All rooms reset' };
 * });
 */

/**
 * Client-side: Call the secure admin function
 */
async function callSecureAdminFunction_EXAMPLE() {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
        alert("You must be logged in to perform this action");
        return;
    }
    
    try {
        const functions = getFunctions();
        const resetAllRooms = httpsCallable(functions, 'resetAllRooms');
        const result = await resetAllRooms();
        alert(result.data.message);
    } catch (error) {
        if (error.code === 'permission-denied') {
            alert("You don't have permission to perform this action");
        } else {
            console.error('Error calling admin function:', error);
            alert("An error occurred. Please try again.");
        }
    }
}

// ============================================================================
// SECURE: JSX Input Elements
// ============================================================================

/**
 * SECURE input elements with proper validation attributes
 */
const SecureInputElements_EXAMPLE = () => (
    <>
        <input 
            ref={roomRef}
            type="text"
            placeholder="Room name"
            pattern="[a-zA-Z0-9_-]{3,20}"
            title="Room name: 3-20 characters, letters, numbers, hyphens, or underscores only"
            required
            maxLength={20}
            id="room"
        />
        <input 
            type="text" 
            ref={nameRef}
            placeholder="Your name"
            pattern="[a-zA-Z0-9_-]{3,20}"
            title="Username: 3-20 characters, letters, numbers, hyphens, or underscores only"
            required
            maxLength={20}
            id="urname"
        />
        <input 
            ref={numRef}
            type="number"  // SECURE: Use type="number" for numeric input
            placeholder="Enter your number"
            min="0"
            max="9999"
            required
            id="num"
        />
    </>
);

// ============================================================================
// Export secure functions
// ============================================================================

export {
    validateInput,
    sanitizeForDisplay,
    submitNumber_SECURE,
    cloneObject_SECURE,
    deepClone_SECURE,
    takeBack_SECURE,
    renderPlayerNames_SECURE,
    joinRoom_SECURE,
    joinNumber_SECURE,
    handleError_SECURE,
};
