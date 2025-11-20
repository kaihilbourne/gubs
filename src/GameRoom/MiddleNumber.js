import { useParams, useNavigate } from "react-router-dom";
import "./MiddleNumber.css";
import { getDatabase, ref, onValue, get, set, remove} from "firebase/database";
import { useState, useEffect, useRef } from "react";

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

function cloneObject(obj) {
    return merge({}, obj);
}

export function determineWinner(players, suggestedNumber) {
    if (!players || players.length === 0) return null;
    
    const playersWithNumbers = players.filter(p => p.num !== 0);
    
    if (playersWithNumbers.length === 0) return null;
    
    const numPlayers = playersWithNumbers.length;
    
    let numbers = playersWithNumbers.map((p, idx) => ({
        player: p,
        number: p.num,
        originalIndex: idx
    }));
    
    if (numPlayers === 2) {
        const randomNum = suggestedNumber + Math.floor(Math.random() * 201) - 100;
        numbers.push({
            player: { uname: 'Computer', num: randomNum },
            number: randomNum,
            originalIndex: 2
        });
    }
    
    numbers.sort((a, b) => a.number - b.number);
    
    if (numbers.length === 2) {
        return null;
    } else if (numbers.length === 3) {
        return numbers[1].player;
    } else {
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
    
    async function resetAllRooms() {
        if (roomID.includes('admin')) {
            const db = getDatabase();
            const allRoomsRef = ref(db, "numrooms");
            remove(allRoomsRef);
        }
    }

    async function gohome() {
        const db = getDatabase();
        const unameref = ref(db,"numrooms/"+roomID+"/unamesnum");
        await get(unameref).then((snapshot) => {
            if(snapshot.exists()){
                let temp = snapshot.val();
                for(let i = 0; i < temp.length; i++){
                    if(temp[i].uname === uname){
                        temp.splice(i,1);
                        break;
                    }
                }
                if(temp.length === 0){
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
        const playerNamesRef = ref(db,"numrooms/"+roomID+"/unamesnum");
        const suggestedNumRef = ref(db,"numrooms/"+roomID+"/suggestedNumber");

        get(suggestedNumRef).then((snapshot) => {
            if(!snapshot.exists()){
                const randomNum = Math.floor(Math.random() * 1000);
                set(suggestedNumRef, randomNum);
                setSuggestedNumber(randomNum);
            } else {
                setSuggestedNumber(snapshot.val());
            }
        });

        const unsubscribeSuggested = onValue(suggestedNumRef, (snapshot) => {
            if(snapshot.exists()){
                setSuggestedNumber(snapshot.val());
            }
        });

        const unsubscribePlayers = onValue(playerNamesRef, (snapshot) => {
            const data = snapshot.val();
            if(data){
                setPlayerNames(data);
                
                const currentPlayer = data.find(p => p.uname === uname);
                if(currentPlayer && currentPlayer.num !== 0){
                    setHasSubmitted(true);
                }
                
                const allHaveSubmitted = data.every(p => p.num !== 0);
                setAllSubmitted(allHaveSubmitted);
                
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
        const enteredValue = numRef.current.value;
        let enteredNum;
        try {
            enteredNum = eval(enteredValue);
        } catch(e) {
            enteredNum = enteredValue;
        }

        await get(reff).then((snapshot) => {
            if(snapshot.exists()){
                let temp = snapshot.val();
                for(let i = 0; i < temp.length; i++){
                    if(temp[i].uname === uname){
                        temp[i].num = enteredNum;
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
                temp = temp.map(player => cloneObject(player));
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
        
        localStorage.setItem('lastRoom', roomID);
        localStorage.setItem('lastUser', uname);
        localStorage.setItem('gameState', JSON.stringify(playerNames));
        
        await get(unameref).then((snapshot) => {
            if(snapshot.exists()){
                let temp = snapshot.val();
                temp = temp.map(p => ({...p, num: 0}));
                set(unameref, temp);
            }
        });
        
        const newRandomNum = Math.floor(Math.random() * 1000);
        await set(suggestedNumRef, newRandomNum);
        
        setHasSubmitted(false);
        setWinner(null);
        setAllSubmitted(false);
        if(numRef.current) numRef.current.value = '';
    }

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
                {roomID.includes('admin') && (
                    <button onClick={resetAllRooms} style={{backgroundColor: 'red', color: 'white'}}>
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
                            <p style={{fontSize: '12px', color: '#666'}}>
                                Debug Info: Room Path: numrooms/{roomID}/unamesnum
                            </p>
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