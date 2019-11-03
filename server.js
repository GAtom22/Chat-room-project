'use strict';

const express     = require('express');
const session     = require('express-session');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const auth        = require('./app/auth.js');
const routes      = require('./app/routes.js');
const mongo       = require('mongodb').MongoClient;
const passport    = require('passport');
const cookieParser= require('cookie-parser')
const app         = express();
const http        = require('http').Server(app);
const sessionStore= new session.MemoryStore();
const io          = require('socket.io')(http);
const passportSocketIo = require('passport.socketio');



fccTesting(app); //For FCC testing purposes

app.use('/public', express.static(process.cwd() + '/public'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'pug')

app.use(session({
  secret: process.env.SECRET_SESSION,
  resave: true,
  saveUninitialized: true,
  key: 'express.sid',
  store: sessionStore,
}));


mongo.connect(process.env.DATABASE_URI, (err, db) => {
    if(err) console.log('Database error: ' + err);
    console.log('Connected to DB');
  
    auth(app, db);
    routes(app, db);
      
    http.listen(process.env.PORT || 3000);

  
    //start socket.io code  
  
  //To get user data from the cookie add the passportSocketIo
  //Thus, the user object is accessible on your socket object as socket.request.user
  io.use(passportSocketIo.authorize({
    cookierParser: cookieParser,
    key: 'express.sid',
    secret: process.env.SECRET_SESSION,
    store: sessionStore
  }))
  
    //For listening for connections on our server
  // It requires 2 arguments: a string containing the title of the event thats emitted,
  // and a function with which the data is passed though
  var currentUsers = 0;
    io.on('connection', socket => {
      console.log('user ' + socket.request.user.name +' has connected');
      ++currentUsers;
      
        // emit the event to all connected users
        io.emit('user', {
           name: socket.request.user.name,
           currentUsers,
           connected: true
         });
      
      
        // Listen for chat message from socket (client)
        socket.on('chat message', (message) => {
          //console.log(message);
          io.emit('chat message', {name: socket.request.user.name, message: message});
        });
      
      // Listen for users disconnection
       socket.on('disconnect', user => {
         io.emit('disconnect',user);
         console.log(socket.request.user.name + ' has left the chat.');
         --currentUsers;
         io.emit('user', {
           name: socket.request.user.name,
           currentUsers,
           connected: false
         });
       });
    });

    //end socket.io code
  
});
