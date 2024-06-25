import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';

import {JoinGame} from './JoinGame/JoinGame.js';
import { GameRoom } from './GameRoom/GameRoom.js';

//
import React, { useState, useEffect } from 'react';


function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<JoinGame/>}/>
        <Route path='/room/:roomID/:uname' element={<GameRoom/>}/>
      </Routes>
    </Router>
  );
}

export default App;
