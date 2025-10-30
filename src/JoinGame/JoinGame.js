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
        navigate('/gubs/'+roomRef.current.value + '/'+nameRef.current.value);
    };

    async function joinNumber(){
        // alert(nameRef.current.value+roomRef.current.value);
        let t = await createNumRoom(nameRef.current.value,roomRef.current.value);
        if(t){
            navigate('/numbers/'+roomRef.current.value + '/'+nameRef.current.value);
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
                pattern="[a-z]{3,}"
                id="room"
            />
            <input 
                type="text" 
                ref = {nameRef}
                placeholder="your name"
                pattern="[a-z]{3,}"
                id="urname"
            />
            <button onClick={joinRoom}>Enter</button>
            <button onClick={joinNumber} isLoading={isLoading}>Play the Middle Number Game</button>
        </div>
    );
}