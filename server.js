const https = require('https');
const http = require('http');
const express = require('express');
const fs = require('fs');
const app = express();
const port = 443;
const pool = require('./db');
const cors = require('cors');
const bcrypt = require('bcrypt');
var session = require('express-session');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();


app.use(express.json());

//load the SSL key and cert that was generated
const options = {
  key: fs.readFileSync('./TLS/private-key.pem'),
  cert: fs.readFileSync('./TLS/certificate.pem')
};

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
}));

app.use(session({
  secret: 'lanky tanky beatle john lennon',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: true,
    httpOnly: true,
    sameSite: 'None',
  }
}))

//check if the user is logged in (has a session)
function isLoggedIn(req, res, next) {
  if (req.session && req.session.userId) { 
    return next(); 
  } 
  else { 
    //console.log("session invalid: ", req.session, req.session.userId);
    res.status(401).send('invalid session'); 
  }
}

//use /sessionIsValid to check that the user is logged on
app.get('/sessionIsValid', isLoggedIn, (req, res) => {
  console.log("session is valid");
  res.status(200).json({ sessionValid: true });
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err);
  } else {
    console.log('Connection successful:', res.rows);
  }
});

//returns just the usernames and IDs of every user
app.get('/getUsernamesAndIds', isLoggedIn, async (req, res) => {
  console.log("inside getUsernamesAndIds request function");
  try {
    const result = await pool.query('SELECT userid, username FROM users');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Could not retreive users' });
  }
});

//returns the username of the current session
app.get('/getCurrentUser', isLoggedIn, async (req, res) => {
  console.log("inside getCurrentUser");
  res.status(200).json(req.session.username);
});

//retreive all users
app.get('/getusers', async (req, res) => {
  console.log("inside getusers request function");
  try {
    const result = await pool.query('SELECT * FROM users');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Could not retreive users' });
  }
});

//retreive all users
app.post('/loginUser', async (req, res) => {
  //get the username and password from the json request
  const { username, password } = req.body;
  console.log("inside login request function");

  try {
    const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    //check if the user exists
    if (user.rows.length <= 0) {
      console.log("User doesn't exist");
      return res.status(400).json({ error: 'User doesn\'t exist' });
    }

    bcrypt.compare(password, user.rows[0].password, function(err, r) {
      if(err) { 
        console.error('There was an error comparing password to hash:', err);
        return;
      }
      if(r) {
        console.log("Correct password");
        req.session.userId = user.rows[0].userid;     //create session
        req.session.username = user.rows[0].username;   //create session

        res.status(200).json({ message: 'Login successful', session: req.session });
      } 
      else {
        console.log("Incorrect password");
        return res.status(400).json({ error: 'Incorrect password' });
      }

    });
  
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Could not login' });
  }
});

//adds user in the database
app.post('/adduser', async (req, res) => {
  //get the username and password from the json request
  const { username, password } = req.body;
  console.log("Inside adduser function");
  const saltRounds = 10;

  try {
    //check if the user already exists
    const alreadyExists = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    //check if something was retrieved from the database based on the username in the request
    if (alreadyExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    console.log("hashing ", password);
    //use bcrypt to hash
    const hash = await bcrypt.hash(password, saltRounds);
    console.log("hashed to ", hash);
    //attempt to create a new user with password
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *', [username, hash]
    );
    console.log(result.rows[0]);


    console.log("User added");
    return res.status(201).json("Account creation successful");
  } catch (err) {
    console.log("Failed to add user");
    return res.status(500).json("Failed to add user");
  }
});

//send message route
app.post('/sendmessage', isLoggedIn, async (req, res) => {
  const { recipientid, msgtext } = req.body;
  const senderID = req.session.userId;
  console.log("Recipient ID: ", recipientid, "Message text: ", msgtext, "sender ID: ", senderID);

  
  const key = process.env.ENCRYPTION_KEY;   //get the encyption key from .env
  const iv = crypto.randomBytes(16);        //generate iv for cipher block chaining

  console.log("key: ", key);
  const keyBuffer = Buffer.from(key, 'hex');
  console.log(keyBuffer);
  console.log('keyBuffer length: ', keyBuffer.length);

  try {
    //encrypt message with CBC
    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv); //create cipher object
    let encryptedMessage = cipher.update(msgtext, 'utf8', 'hex'); //create encrypted message
    encryptedMessage += cipher.final('hex');

    console.log("encrypted message: ", encryptedMessage);

    //insert the msg message into the messages db
    const result = await pool.query(
      'INSERT INTO messages (userid, recipientid, msgtext, iv, timesent) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *',
      [senderID, recipientid, encryptedMessage, iv]
    );
    
    res.status(200).json(result.rows[0]);  //returns the result
  } 
  catch (err) {
    console.log('Message failed to send');
    res.status(500).json({ error: 'Message failed to send' });
  }
});

//download every message that a user has with other users
app.post('/downloadmessages', isLoggedIn, async (req, res) => {
  console.log('inside downloadmessages');
  const { recipientid } = req.body;
  const userID = req.session.userId;  //set the userID to the one based on the session

  try {
    //get all the messages from the database where the user is the sender or recipient
    const result = await pool.query(
      'SELECT * FROM messages WHERE (userid = $1 AND recipientid = $2) OR (recipientid = $1 AND userid = $2) ORDER BY timesent DESC', 
      [userID, recipientid]
    );

  const key = process.env.ENCRYPTION_KEY;   //get the encyption key from .env
  console.log('Encryption key length:', Buffer.from(key, 'utf-8').length);

    const decryptedMessages = result.rows.map(msg => {
      //decrypt messages from database using map
      const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), msg.iv); // make decipher object
      let decryptedMessage = decipher.update(msg.msgtext, 'hex', 'utf8');
      decryptedMessage += decipher.final('utf8');
      
      //return everthing but the iv, including the decrpyted messages
      return {
        timesent: msg.timesent,
        recipientid: msg.recipientid,
        msgid: msg.msgid,
        userid: msg.userid,
        msgtext: decryptedMessage
      };
    });
    
    console.log(decryptedMessages);
    //return every message retrieved from db
    res.status(200).json(decryptedMessages);
  } 
  catch (err) {
    console.error('Error getting messages:', err);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

http.createServer((req, res) => {
  console.log(`Received HTTP request: ${req.url}`);
  res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
  res.end();
}).listen(80, () => {
  console.log('HTTP server running on http://localhost:80 for HTTPS redirection');
});

https.createServer(options, app).listen(port, () => {
  console.log('Server running on https://localhost:443');
});