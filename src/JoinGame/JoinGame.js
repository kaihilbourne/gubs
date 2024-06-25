import { useState,useRef } from "react";
import "./JoinGame.css";
import { useNavigate } from "react-router-dom";

export function JoinGame(){
    const roomRef = useRef(null);
    const nameRef = useRef(null);
    const navigate = useNavigate();


    const joinRoom = () => {
        navigate('/room/'+roomRef.current.value + '/'+nameRef.current.value);
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
            />
            <input 
                type="text" 
                ref = {nameRef}
                placeholder="your name"
            />
            <button onClick={joinRoom}>Enter</button>
        </div>
    );
}