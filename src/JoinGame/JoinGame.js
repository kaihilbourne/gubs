import { useState,useRef } from "react";
import "./JoinGame.css";
import { useNavigate } from "react-router-dom";
import { createNumberRoom } from "../Database/DBFunctions";

export function JoinGame(){
    const roomRef = useRef(null);
    const nameRef = useRef(null);
    const navigate = useNavigate();


    const joinRoom = () => {
        navigate('/gubs/'+roomRef.current.value + '/'+nameRef.current.value);
    };

    const joinNumber = () => {
        alert(nameRef.current.value+roomRef.current.value);
        if(createNumberRoom(nameRef.current.value,roomRef.current.value)){
            navigate('/numbers/'+roomRef.current.value + '/'+nameRef.current.value);
        } else{
            alert("The grinch stole your username");
        }
    };

    const validateForms = () => {
        const room = document.getElementById("room");
        const urname = document.getElementById("urname");
        if(room.value[-1] != "[a-z]"){
            room.value = room.value[0,-1];
        }
    };

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
            <button onClick={joinNumber}>Play the Middle Number Game</button>
        </div>
    );
}