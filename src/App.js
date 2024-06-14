import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';

import {JoinGame} from './JoinGame/JoinGame.js'

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<JoinGame/>}/>
      </Routes>
    </Router>
  );
}

export default App;
