import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors'; 
import { mockUsers, mockCurrentGameState, mockActivityFeed, mockCurrentUser, updateMockUserClipAndReign, findReigningUser, dethroneUser, addActivityEvent } from './data.js'; //importing all the mockData and helper functions

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

// SOCKET IO SET UP
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('addActivity', (event) => {
        console.log('Processing addActivity event:', event);
        addActivityEvent(event); // Update the mockActivityFeed on the server
        io.emit('activityFeedUpdated', mockActivityFeed); // Broadcast updated feed to all clients
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});