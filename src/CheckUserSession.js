import React, {useEffect} from 'react';
import './App.css';
import { useNavigate } from 'react-router-dom';

//this page is the origin of the website. all it does is checks if the user
//is logged in. If they are, reroute to chat, otherwise reroute to login
function CheckUserSession() {
  const nav = useNavigate();

  //useEffect to redirect if session isn't valid
  useEffect(() => {
  const checkSession = async () => {
    try {
      const resp = await fetch('http://localhost:443/sessionIsValid', {
      //this line sends cookies, like session
      credentials: 'include',
      });
      if (!resp.ok) {
        throw new Error('Session invalid');
      }
      const data = await resp.json();
      if (data.sessionValid) {
        //redirect to Chat page if the session is valid
        nav('/Chat');
      }
      else {
        //if session isn't valid, route to Login
        nav('/Login');
      }
    } 
      //reroute if there was an error
    catch (error) {
      nav('/Login');
    }
  };
    
    checkSession();
    }, [nav]);
  
  return (
    <>
      
    </>
  );
}

export default CheckUserSession;
