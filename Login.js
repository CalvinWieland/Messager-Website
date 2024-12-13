import React, {useState} from 'react';
import logo from './assets/thickerlogo.png'
import './LoginAndRegister.css';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const nav = useNavigate();

  const doLogin = async () => {
  //if the Username or password fields are empty, 
    if (username.trim() === '' || password.trim() === '') {
      console.log('Username or password field is empty');
      setErrMsg("Error: empty username/password");
      return;
    }
    
    try {
      const response = await fetch('https://localhost:443/loginUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      //console.log("response after login: ", response);
      

      if (response.ok) {
        const data = await response.json();
        console.log('User logged in successfully:', data);

        nav('/Chat');
      } 
      else {
        console.error('Failed to login:');
        setErrMsg(response.statusText);
      }
    } 
    catch (error) {
      console.error('There was an error: ', error);
      setErrMsg("There was an error");
    }
  }

  const goToRegister = () => {
    nav('/Register');
  };

    return (
      <>
      <img className="logoimg" id="logoimg" src={logo} alt="logo for website"></img>
      <div>
        <input type="text" placeholder="Username" className="LoginBar" value={username} onChange={(e) => setUsername(e.target.value)}></input>
      </div>
      <div>
        <input type="password" placeholder="Password" className="LoginBar" value={password} onChange={(e) => setPassword(e.target.value)}></input>
      </div>
      <div className='padding'></div>
      <button type="button" className="Login-buttonss" onClick={doLogin}>Login</button>
      <p onClick={goToRegister} className="register">Register</p>
      {/* Prints an error message if errMsg is not nulll */}
      {errMsg && <p className="error-message">{errMsg}</p>}
    </>
    );
  }
  

export default Login;