import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors'; 
import { mockUsers, mockCurrentGameState, mockActivityFeed, mockCurrentUser, updateMockUserClipAndReign, findReigningUser, dethroneUser, addActivityEvent, incrementReigningUserTotalTime } from './data.js'; //importing all the mockData and helper functions

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:8080", // socket server intialize
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;

//MIDDLEWARES
//cors
app.use(cors());
//parsing json into javascript object
app.use(express.json()); // 

// API ENDPOINTS WE ARE USING
app.get('/ping', (req, res) => { //checking
    res.send('pong');
});


app.get('/api/users', (req, res) => {
    res.json(mockUsers);
});

app.get('/api/current-game-state', (req, res) => {
    res.json(mockCurrentGameState);
});

app.get('/api/activity-feed', (req, res) => {
    res.json(mockActivityFeed);
});

app.get('/api/current-user', (req, res) => {
    res.json(mockCurrentUser);
});

// update the totalTimeHeld for current reigning user, second by second
setInterval(() => {
    incrementReigningUserTotalTime(); //find the reigning player, and increment their totalTimeHeld inside 'users' 
    io.emit('usersUpdated', mockUsers); // Broadcast updated users to all clients
}, 1000); // Update every second

// SOCKET IO SET UP
io.on('connection', (socket) => { //socket represents only one specific client
    console.log('A user connected');

    //addActivity event from client
    socket.on('addActivity', (event) => {
        console.log('Processing addActivity event:', event);
        addActivityEvent(event); // Update the data inside 'data.js' file using this helper function
        io.emit('activityFeedUpdated', mockActivityFeed); // we are emitting this 'activityFeedUpdated' and updated 'mockActivityFeed'  to all clients, not just our single client
    });

    //updateUserClipAndReign event from client
    socket.on('updateUserClipAndReign', ({ userId, newClipUrl, newReignStart }) => {
        console.log('Processing updateUserClipAndReign event:', { userId, newClipUrl, newReignStart });
        updateMockUserClipAndReign(userId, newClipUrl, newReignStart); // we finds out current user, and update it in 'users', then also put it inside 'gameState' to set as reigning player
        io.emit('usersUpdated', mockUsers); // Broadcast updated users to every client
        io.emit('gameStateUpdated', mockCurrentGameState); // Broadcast updated game state to every client
    });

    //dethroneUser event from client
    socket.on('dethroneUser', ({ userId }) => {
        console.log('Processing dethroneUser event for userId:', userId);
        dethroneUser(userId); // Update data of dethroned reigning user in 'user' espeically their totalTimeHeld and currentReignStart to null
        io.emit('usersUpdated', mockUsers); // Broadcast updated users data to everyone
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});