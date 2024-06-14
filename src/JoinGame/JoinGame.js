import { useState,useRef } from "react";
import "./JoinGame.css";
import io from 'socket.io-client';

export function JoinGame(){
    const roomRef = useRef(null);

    const [room,setRoom] = useState('');
    const [usename,setName] = useState('');

    io.on('connection', (socket) => {
        console.log('a user connected');
        socket.on('disconnect', () => {
            console.log('user disconnected');
        });
    });

    const joinRoom = (room) => {
        setRoom(roomRef.current.value);
        console.log(roomRef.current.value);
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
                value={usename}
                onChange={(e) => setName(e.target.value)}
                placeholder="your name"
            />
            <button onClick={joinRoom}>Enter</button>
        </div>
    );
}