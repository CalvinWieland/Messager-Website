import React, {useEffect, useState} from 'react';
import './Chat.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Chat() {
  const [sidebarExp, setSidebarExp] = useState(false);
  const [messages, setMessages] = useState([]);
  const [recipientName, setRecipientName] = useState(null);
  const [recipientID, setRecipientID] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const nav = useNavigate();

  //this useEffect checks users on the database once
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('https://localhost:443/getUsernamesAndIds', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setUsersList(data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  //useEffect checks the current user and sets it
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('https://localhost:443/getCurrentUser', {
        credentials: 'include',
          });
        if (response.ok) {
          const data = await response.json(); 
          setCurrentUser(data);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
        }
    };
    
    fetchCurrentUser();
  }, []);

  //useEffect to redirect if session isn't valid
  useEffect(() => {
    const checkSession = async () => {
      try {
        const resp = await fetch('https://localhost:443/sessionIsValid', {
        //this line sends cookies, like session
        credentials: 'include',
      });
      if (!resp.ok) {
        throw new Error('Session invalid');
      }
      const data = await resp.json();
      if (!data.sessionValid) {
        //redirect to Login page if the session isn't valid
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


  useEffect(() => {
    const chatBar = document.querySelector('.chatBar');
    const inputHandler = function() {
      this.style.height = '29px';
      this.style.height = this.scrollHeight + 'px';
    };

    chatBar.addEventListener('input', inputHandler);

    return() => {
      chatBar.removeEventListener('input', inputHandler);
    }
  }, []);


  const openCloseSidebar = () => {
      setSidebarExp(!sidebarExp);
  };

  const createMessage = (userName, txt) => {
    const newMessage = {userName, txt}
    setMessages(prevMessages => [newMessage, ...prevMessages]);
  };

  //sends a message and adds it to the messages list
  const sendMessage = async () => {
    try {
      if(recipientID === null) {
        console.log('Message error: recipient not selected');
        return;
      }
      //send message to the server
      const response = await axios.post(
        'https://localhost:443/sendmessage',
        { msgtext: messageText, recipientid: recipientID },
        { withCredentials: true }
      );

      //if message was sent successfully, add it to the list
      if(response.status === 200) {
        createMessage(currentUser, messageText);
      }

      // set the message text to 0
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  //gets all messages between two users from the database (the selected recipient and the user on the session)
  useEffect(() => {
    const fetchMessages = setInterval(async () => {
      console.log("Inside fetchmessages useEffect");
      if(recipientID === null) {
        console.log('Message error: recipient not selected');
        return;
      }
  
      try {
        const response = await axios.post(
          `https://localhost:443/downloadmessages`,
          { recipientid: recipientID },
          { withCredentials: true }
        );
  
        if (response.status === 200) {
          const fetchedMessages = response.data.map(msg => ({
            userName: msg.userid === recipientID ? recipientName : currentUser, //set the userName portion of the text
            txt: msg.msgtext,
          }));
  
          setMessages(fetchedMessages);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    }, 1000);
  
    return () => clearInterval(fetchMessages);
  }, [recipientID, currentUser, recipientName]);

  return (
    <>
    <div className="container">
      <div className={`sidebar ${sidebarExp ? 'exp' : ''}`}>
        <button onClick={openCloseSidebar}>☰</button>
        {/*display users in hamburger menu*/}
        {sidebarExp && (
        <div className="userList">
            {usersList.map((user) => (
              <div key={user.userid} onClick={() => { setRecipientID(user.userid); setRecipientName(user.username); }} className="user">
                {user.username}
              </div>
            ))}
        </div>
        )}
      </div>
      <div className="messageBox">
        <div className="messagesDisplay">
          {messages.map((msg, index) => (
          <div key={index} className="message">{msg.userName}{": "}{msg.txt}</div>
            ))}
        </div>
        <textarea className="chatBar" id="text" type="text" onChange={(e) => setMessageText(e.target.value)} 
        onKeyDown={(e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
          e.preventDefault();
          sendMessage();
          //createMessage('username', e.target.value);
          e.target.value = '';
          }
        }}></textarea>
      </div>
    </div>
        </>
  );
 }
  

export default Chat;