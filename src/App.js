import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';

import {JoinGame} from './JoinGame/JoinGame.js';
import { GameRoom } from './GameRoom/GameRoom.js';

//
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:4000');
//


function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<JoinGame/>}/>
        <Route path='/room/:roomID' element={<GameRoom/>}/>
      </Routes>
    </Router>
  );
}

export default App;
