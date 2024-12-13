import React, {useState} from 'react';
import logo from './assets/thickerlogo.png'
import './LoginAndRegister.css';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const nav = useNavigate();

  const doRegister = async () => {
    //if the Username or password fields are empty, 
    if (username.trim() === '' || password.trim() === '') {
      console.log('Username or password field is empty');
      setErrMsg("Error: empty username/password");
      return;
    }
    
    try {
      const response = await fetch('https://localhost:443/adduser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password })
      });

    
    if (response.ok) {
      const data = await response.json();
      console.log('User added successfully:', data);

      nav('/Login');
    } else {
      console.error('Failed to add user:', response.statusText);
      setErrMsg("Failed to create user");
    }
    } catch (error) {
      console.error('There was an error: ', error);
      setErrMsg("There was an error");
    }
  }

    return (
      <>
        <p>Create an account</p>
        <img className="logoimg" id="logoimg" src={logo} alt="logo for website"></img>
        <div>
          <input type="text" placeholder="Username" className="LoginBar" value={username} onChange={(e) => setUsername(e.target.value)}></input>
        </div>
        <div>
          <input type="password" placeholder="Password" className="LoginBar" value={password} onChange={(e) => setPassword(e.target.value)}></input>
        </div>
        <div className='padding'></div>
        <button type="button" className="Login-buttonss" onClick={doRegister}>Register</button>
        {/* Prints an error message if errMsg is not nnull */}
        {errMsg && <p className="error-message">{errMsg}</p>}
      </>
    );
  }
  

export default Register;