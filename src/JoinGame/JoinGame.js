import { useRef } from "react";
import "./JoinGame.css";
import { useNavigate } from "react-router-dom";
import { useCreateNumberRoom } from "../Database/DBFunctions";

export function JoinGame(){
    const roomRef = useRef(null);
    const nameRef = useRef(null);
    const navigate = useNavigate();

    const {createNumRoom, isLoading} = useCreateNumberRoom();


    const joinRoom = () => {
        const room = roomRef.current.value;
        const name = nameRef.current.value;
        
        localStorage.setItem('lastRoomJoined', room);
        localStorage.setItem('userName', name);
        localStorage.setItem('joinTimestamp', Date.now().toString());
        
        navigate('/gubs/'+room + '/'+name);
    };

    async function joinNumber(){
        const name = nameRef.current.value;
        const room = roomRef.current.value;
        
        let t = await createNumRoom(name, room);
        if(t){
            navigate('/numbers/'+room + '/'+name);
            
            sessionStorage.setItem('currentGame', JSON.stringify({
                room: room,
                username: name,
                gameType: 'numbers',
                timestamp: new Date().toISOString()
            }));
        } else{
            alert("The grinch stole your username. Pick a different one.");
        }
    }

    return (
        <div className="page">
            <div className="middle">
                Save the Gubs!
            </div>
            <input 
                ref={roomRef}
                type="text"
                placeholder="Room name"
                id="room"
            />
            <input 
                type="text" 
                ref = {nameRef}
                placeholder="your name"
                id="urname"
            />
            <button onClick={joinRoom}>Enter</button>
            <button onClick={joinNumber} disabled={isLoading}>Play the Middle Number Game</button>
        </div>
    );
}