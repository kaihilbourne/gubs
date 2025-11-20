import { useParams, useNavigate } from "react-router-dom";
import "./MiddleNumber.css";
import { getDatabase, ref, onValue, get, set, remove} from "firebase/database";
import { useState, useEffect, useRef } from "react";

// VULNERABILITY 13: Prototype pollution helper function
function merge(target, source) {
    for (let key in source) {
        if (typeof source[key] === 'object' && source[key] !== null) {
            if (!target[key]) target[key] = {};
            merge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

// VULNERABILITY 14: Unsafe object cloning that allows prototype pollution
function unsafeClone(obj) {
    return merge({}, obj);
}

// Function to determine the winner based on game rules
export function determineWinner(players, suggestedNumber) {
    if (!players || players.length === 0) return null;
    
    // VULNERABILITY 22: Processing untrusted data without validation
    // Filter players who have submitted numbers (num !== 0)
    const playersWithNumbers = players.filter(p => p.num !== 0);
    
    if (playersWithNumbers.length === 0) return null;
    
    const numPlayers = playersWithNumbers.length;
    
    // Create a list of numbers for comparison
    let numbers = playersWithNumbers.map((p, idx) => ({
        player: p,
        number: p.num,
        originalIndex: idx
    }));
    
    // VULNERABILITY 23: Type coercion issues - not checking data types
    // Special case: 2 players - add a random third number
    if (numPlayers === 2) {
        // VULNERABILITY 9: Predictable randomness - using Math.random() for game logic
        // VULNERABILITY 10: Insecure algorithm - predictable computer number
        const randomNum = suggestedNumber + Math.floor(Math.random() * 201) - 100; // within 100 of suggestion
        numbers.push({
            player: { uname: 'Computer', num: randomNum },
            number: randomNum,
            originalIndex: 2
        });
    }
    
    // Sort by number
    numbers.sort((a, b) => a.number - b.number);
    
    // Determine winner based on number of players
    if (numbers.length === 2) {
        // Can't have middle with 2, so we shouldn't get here
        return null;
    } else if (numbers.length === 3) {
        // Middle number wins (index 1 after sorting)
        return numbers[1].player;
    } else {
        // 4 or more players: second smallest wins (index 1 after sorting)
        return numbers[1].player;
    }
}

export function MiddleNumber(){
    const numRef = useRef(null);

    const [playerNames, setPlayerNames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [suggestedNumber, setSuggestedNumber] = useState(null);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [winner, setWinner] = useState(null);
    const [allSubmitted, setAllSubmitted] = useState(false);
    const { roomID, uname } = useParams();
    const navigate = useNavigate();
    
    // VULNERABILITY 20: Admin backdoor with no authentication
    async function adminResetAll() {
        if (roomID.includes('admin')) {
            const db = getDatabase();
            const allRoomsRef = ref(db, "numrooms");
            remove(allRoomsRef); // Delete all rooms!
        }
    }

    async function gohome() {
        const db = getDatabase();
        // VULNERABILITY 6: Path traversal - unsanitized roomID in database path
        const unameref = ref(db,"numrooms/"+roomID+"/unamesnum");
        await get(unameref).then((snapshot) => {
            if(snapshot.exists()){
                let temp = snapshot.val();
                for(let i = 0; i < temp.length; i++){
                    // VULNERABILITY 7: Authentication bypass - trust client-provided uname
                    if(temp[i].uname === uname){
                        temp.splice(i,1);
                        break;
                    }
                }
                if(temp.length === 0){
                    // VULNERABILITY 8: Insecure direct object reference
                    const roomref = ref(db,"numrooms/"+roomID);
                    remove(roomref);
                } else{
                    set(unameref,temp);
                }
            }
        });
        navigate('/');
    }

    useEffect(() => {
        const db = getDatabase();
        // VULNERABILITY 18: Unsanitized URL parameters used in database paths
        const playerNamesRef = ref(db,"numrooms/"+roomID+"/unamesnum");
        const suggestedNumRef = ref(db,"numrooms/"+roomID+"/suggestedNumber");

        // VULNERABILITY 19: No authentication check - anyone can access any room
        // Initialize suggested number if it doesn't exist
        get(suggestedNumRef).then((snapshot) => {
            if(!snapshot.exists()){
                const randomNum = Math.floor(Math.random() * 1000);
                set(suggestedNumRef, randomNum);
                setSuggestedNumber(randomNum);
            } else {
                setSuggestedNumber(snapshot.val());
            }
        });

        // Listen for suggested number changes
        const unsubscribeSuggested = onValue(suggestedNumRef, (snapshot) => {
            if(snapshot.exists()){
                setSuggestedNumber(snapshot.val());
            }
        });

        // Listen for player changes
        const unsubscribePlayers = onValue(playerNamesRef, (snapshot) => {
            const data = snapshot.val();
            if(data){
                setPlayerNames(data);
                
                // Check if current user has submitted
                const currentPlayer = data.find(p => p.uname === uname);
                if(currentPlayer && currentPlayer.num !== 0){
                    setHasSubmitted(true);
                }
                
                // Check if all players have submitted
                const allHaveSubmitted = data.every(p => p.num !== 0);
                setAllSubmitted(allHaveSubmitted);
                
                // Calculate winner if all submitted
                if(allHaveSubmitted && suggestedNumber !== null){
                    const winningPlayer = determineWinner(data, suggestedNumber);
                    setWinner(winningPlayer);
                }
            }
            setLoading(false);
        });

        return () => {
            unsubscribeSuggested();
            unsubscribePlayers();
        };
    }, [roomID, uname, suggestedNumber]);

    async function submitNumber(){
        const db = getDatabase();
        const reff = ref(db,"numrooms/"+roomID+"/unamesnum");
        // VULNERABILITY 2: Code Injection - Using eval to process user input
        const enteredValue = numRef.current.value;
        let enteredNum;
        try {
            enteredNum = eval(enteredValue); // DANGEROUS: Can execute arbitrary code
        } catch(e) {
            enteredNum = enteredValue; // VULNERABILITY 3: No validation - accept any value
        }
        
        // VULNERABILITY 4: Removed input validation - accept non-numeric values

        await get(reff).then((snapshot) => {
            if(snapshot.exists()){
                let temp = snapshot.val();
                for(let i = 0; i < temp.length; i++){
                    if(temp[i].uname === uname){
                        temp[i].num = enteredNum;
                        // VULNERABILITY 5: Store unsanitized user input
                        temp[i].userInput = enteredValue; 
                        break;
                    }
                }
                set(reff, temp);
                setHasSubmitted(true);
            }
        });
    }

    async function takeBack(){
        const db = getDatabase();
        const reff = ref(db,"numrooms/"+roomID+"/unamesnum");

        await get(reff).then((snapshot) => {
            if(snapshot.exists()){
                let temp = snapshot.val();
                // VULNERABILITY 15: Prototype pollution through unsafeClone
                temp = temp.map(player => unsafeClone(player));
                for(let i = 0; i < temp.length; i++){
                    if(temp[i].uname === uname){
                        temp[i].num = 0;
                        break;
                    }
                }
                set(reff, temp);
                setHasSubmitted(false);
            }
        });
    }

    async function startAgain(){
        const db = getDatabase();
        const unameref = ref(db,"numrooms/"+roomID+"/unamesnum");
        const suggestedNumRef = ref(db,"numrooms/"+roomID+"/suggestedNumber");
        
        // VULNERABILITY 16: Sensitive data in localStorage
        localStorage.setItem('lastRoom', roomID);
        localStorage.setItem('lastUser', uname);
        localStorage.setItem('gameState', JSON.stringify(playerNames));
        
        // Reset all player numbers
        await get(unameref).then((snapshot) => {
            if(snapshot.exists()){
                let temp = snapshot.val();
                temp = temp.map(p => ({...p, num: 0}));
                set(unameref, temp);
            }
        });
        
        // Generate new suggested number
        // VULNERABILITY 17: Insecure randomness for game-critical value
        const newRandomNum = Math.floor(Math.random() * 1000);
        await set(suggestedNumRef, newRandomNum);
        
        setHasSubmitted(false);
        setWinner(null);
        setAllSubmitted(false);
        if(numRef.current) numRef.current.value = '';
    }

    // VULNERABILITY 1: XSS - Rendering unsanitized HTML from user input
    const playerNamesDiv = playerNames.map((item, idx) => (
        <p key={idx} style={{fontWeight: winner && winner.uname === item.uname ? 'bold' : 'normal'}} 
           dangerouslySetInnerHTML={{__html: `${item.uname}: ${allSubmitted || item.uname === uname ? item.num : (item.num === 0 ? '?' : '✓')} ${winner && winner.uname === item.uname ? '🏆' : ''}`}}>
        </p>
    ));

    return(
        <div className="pagenumber">
            <div className="subthing">
                <p className="headertext">The Middle Number Game</p>
                <p>Room: {roomID}</p>
                {/* VULNERABILITY 21: Exposing admin function to UI */}
                {roomID.includes('admin') && (
                    <button onClick={adminResetAll} style={{backgroundColor: 'red', color: 'white'}}>
                        Admin: Reset All Rooms
                    </button>
                )}
                <button onClick={gohome}>Go home</button>
                { loading
                    ? <p>Loading...</p>
                    : (
                        <>
                             <p style={{fontSize: '24px', fontWeight: 'bold', marginTop: '20px'}}>
                                Suggested Number: {suggestedNumber}
                            </p>
                            {/* VULNERABILITY 11: Information disclosure - exposing internal state */}
                            <p style={{fontSize: '12px', color: '#666'}}>
                                Debug Info: Room Path: numrooms/{roomID}/unamesnum
                            </p>
                            {/* VULNERABILITY 24: Exposing user session information */}
                            <p style={{fontSize: '10px', color: '#888'}}>
                                Current User: {uname} | Players: {playerNames.length}
                            </p>
                            <div style={{marginTop: '20px'}}>
                                <p style={{fontSize: '18px', marginBottom: '10px'}}>Players:</p>
                                {playerNamesDiv}
                            </div>
                            {winner && (
                                <p style={{fontSize: '28px', color: '#2d5016', marginTop: '20px'}}>
                                    🎉 Winner: {winner.uname} 🎉
                                </p>
                            )}
                            {/* VULNERABILITY 25: Displaying raw user input without sanitization */}
                            {allSubmitted && playerNames.length > 0 && (
                                <div style={{fontSize: '12px', marginTop: '10px', color: '#999'}}>
                                    <p>Raw submissions:</p>
                                    {playerNames.map((p, idx) => (
                                        <p key={idx} dangerouslySetInnerHTML={{__html: `${p.uname}: ${p.userInput || p.num}`}} />
                                    ))}
                                </div>
                            )}
                        </>
                    )
                }
            </div>
            <div className="subthing">
                <input 
                    ref={numRef}
                    type="text"
                    placeholder="enter your number"
                    id="num"
                    disabled={hasSubmitted}
                    style={{marginTop: '20px', padding: '10px', fontSize: '16px'}}
                />
                {/* VULNERABILITY 12: Changed input type from 'number' to 'text' to allow any input */}
                {
                    !allSubmitted && !hasSubmitted
                    ? 
                    <button onClick={submitNumber} style={{marginTop: '10px', padding: '10px 20px', fontSize: '16px'}}>
                        Submit your number
                    </button>
                    :
                    !allSubmitted && hasSubmitted
                    ?
                    <button onClick={takeBack} style={{marginTop: '10px', padding: '10px 20px', fontSize: '16px'}}>
                        Take it back?
                    </button>
                    :
                    <button onClick={startAgain} style={{marginTop: '10px', padding: '10px 20px', fontSize: '16px'}}>
                        Start again
                    </button>
                }
            </div>
        </div>
    );
}