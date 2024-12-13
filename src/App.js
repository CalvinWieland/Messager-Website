//import logo from './logo.svg';
import Login from './Login'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Chat from './Chat'
import Register from './Register'
import CheckUserSession from './CheckUserSession'

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
        <Routes>
          <Route path="/" element={<CheckUserSession />} /> 
          <Route path="/Login" element={<Login />} />
          <Route path="/Register" element={<Register />} />
          <Route path="/Chat" element={<Chat/>} />
        </Routes>
        </header>
      </div>
    </Router>
  );
}

export default App;
