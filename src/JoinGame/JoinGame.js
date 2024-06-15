import { useState,useRef } from "react";
import "./JoinGame.css";
import io from 'socket.io-client';
import { useNavigate } from "react-router-dom";

export function JoinGame(){
    const roomRef = useRef(null);
    const nameRef = useRef(null);
    const navigate = useNavigate();

    const socket = io('http://localhost:4000');

    const [room,setRoom] = useState('');
    const [usename,setName] = useState('');

    socket.on('chat message', (msg) => {
        console.log(msg);
        navigate('/room/'+msg);
    });


    const joinRoom = () => {
        setRoom(roomRef.current.value);
        console.log(roomRef.current.value);
        socket.emit('chat message',roomRef.current.value);
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