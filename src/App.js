import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';

import {JoinGame} from './JoinGame/JoinGame.js';
import { GameRoom } from './GameRoom/GameRoom.js';

import React, { useState, useEffect } from 'react';
import { MiddleNumber } from './GameRoom/MiddleNumber.js';


function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<JoinGame/>}/>
        <Route path='/gubs/:roomID/:uname' element={<GameRoom/>}/>
        <Route path='/numbers/:roomID/:uname' element={<MiddleNumber/>}/>
      </Routes>
    </Router>
  );
}

export default App;
