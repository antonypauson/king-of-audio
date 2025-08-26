import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors'; 
import fileUpload from 'express-fileupload'; // Import express-fileupload for audio uploading api endpoint
// import { mockCurrentGameState, mockActivityFeed, updateMockUserClipAndReign, findReigningUser, dethroneUser, addActivityEvent, incrementReigningUserTotalTime, isUsernameUnique, addNewUser } from './data.js'; //importing all the mockData and helper functions
import dotenv from "dotenv"; 
dotenv.config(); 
import { getUsersFromSupabase, isUsernameUniqueInSupabase, addNewUserToSupabase, updateUserClipAndReignInSupabase, dethroneUserInSupabase, findReigningUserInSupabase, getGameStateFromSupabase, getActivityFeedFromSupabase, addActivityEventToSupabase, incrementReigningUserTotalTimeInSupabase, uploadAudioToSupabase} from './supabaseService.js';
import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin'; //firebase admin sdk
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('./serviceAccountKey.json');//contains firebase sensitive data for verifying the user's token id

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:8080", // socket server intialize
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;

const supabaseUrl = process.env.SUPABASE_URL; 
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey); //exported our supabase client, so it can used inside supabaseService.js file


//MIDDLEWARES
//cors
app.use(cors());
//parsing json into javascript object
app.use(express.json()); 
app.use(fileUpload()); // Use express-fileupload middleware 

// Middleware to verify Firebase ID Token
// this is applied using app.use(verifyFirebaseToken) later
const verifyFirebaseToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided or invalid format.' });
    }

    const idToken = authHeader.split('Bearer ')[1]; //takes out the token from our Bearer token in the header

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken); //contains auth details like username, uid etc. 
        req.user = decodedToken; // Attach the decoded token to the request object
        next(); //continue with next objective of the request
    } catch (error) {
        console.error('Error verifying Firebase ID token:', error);
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }
}; 

// API ENDPOINTS WE ARE USING
app.get('/ping', (req, res) => { //checking
    res.send('pong');
});

app.get('/api/testing', async (req, res) => {
    try {
        const {data, error} = await supabase.from('testing').insert([{message: "Test message from backend"}]); 

        if (error) {
            console.error("ERROR"); 
            return res.status(500).json({success: false, message: "Failed"})
        }

        console.log("Successful insertion"); 
        res.status(200).json({success: true, message: 'Successful data insert'})
    } catch (e) {
        console.error(e); 
    }
})

app.use(verifyFirebaseToken); // Apply middleware to all routes below this line

app.get('/api/users', async (req, res) => {
    //we were taking users from mockUsers, not its from our supabase db.
    const users = await getUsersFromSupabase();
    res.json(users);
});

app.get('/api/current-game-state', async (req, res) => {
    const gameState = await getGameStateFromSupabase();
    res.json(gameState);
}); 


app.get('/api/activity-feed', async (req, res) => {
    const activityFeed = await getActivityFeedFromSupabase(); //from the db
    res.json(activityFeed);
});

// app.get('/api/current-user', (req, res) => {
//     res.json(mockCurrentUser); //we dont get current user from mockData anymore
// });

// we check if a username is unique after looking up mockdata
// sent back the Index.tsx file
app.get('/api/check-username-uniqueness', async (req, res) => {
    const { username } = req.query;
    if (!username) {
        return res.status(400).json({ error: 'Username parameter is required.' });
    }
    const unique = await isUsernameUniqueInSupabase(username); //isUsernameUniqueInSupabase checking if the name is unique
    res.json({ isUnique: unique });
});

// we after a username has been entered, we create new user
// add that to our users table
app.post('/api/add-new-user', async (req, res) => {
    const { username, avatarUrl } = req.body;
    const id = req.user.uid; // Get UID from verified token
    if (!id || !username || !avatarUrl) {
        return res.status(400).json({ error: 'User ID, username, and avatar URL are required.' });
    }
    
    const { user: newUser, created } = await addNewUserToSupabase(id, username, avatarUrl);
    if (newUser) { // Check if a user object was returned (either new or existing)
        const updatedUsers = await getUsersFromSupabase(); // Fetch updated list of users
        io.emit('usersUpdated', updatedUsers); // Broadcast updated users to all clients
        
        if (created) { // Only add 'join' event if a new user was created
            await addActivityEventToSupabase({
                type: "join",
                userId: id,
                timestamp: Date.now(),
            });
            const updatedActivityFeed = await getActivityFeedFromSupabase();
            io.emit('activityFeedUpdated', updatedActivityFeed); // Broadcast updated activity feed to every clients using sockets
        }
        res.status(201).json(newUser);
    } else {
        res.status(500).json({ message: 'Failed to add or retrieve user.' }); // Handle case where newUser is null (error in supabaseService)
    }
});

// New endpoint for audio upload
app.post('/api/upload-audio', async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    let audioFile = req.files.audioFile; // 'audioFile' is the name of the input field in the form

    if (!audioFile.mimetype.startsWith('audio/')) {
        return res.status(400).send('Only audio files are allowed.');
    }

    try {
        // Use a fixed filename to ensure overwriting
        const fixedFileName = 'king_of_audio.webm'; // webm format from recorder
        const publicUrl = await uploadAudioToSupabase(audioFile.data, fixedFileName, audioFile.mimetype);
        res.status(200).json({ publicUrl });
    } catch (error) {
        console.error('Error uploading audio:', error);
        res.status(500).send('Error uploading audio.');
    }
});

setInterval(async () => {
    const reigningUser = await findReigningUserInSupabase();
    if (reigningUser) {
        await incrementReigningUserTotalTimeInSupabase(reigningUser.id); //find the reigning player, and increment their totalTimeHeld inside 'users' 
        const updatedUsers = await getUsersFromSupabase();
        io.emit('usersUpdated', updatedUsers); // Broadcast updated users to all clients
    }
}, 1000); // Update every second

// SOCKET IO SET UP
io.on('connection', async (socket) => { //socket represents only one specific client
    console.log('A user connected');

    const idToken = socket.handshake.query.token;

    if (!idToken) {
        console.log('No token provided for Socket.IO connection.');
        socket.disconnect(true); // Disconnect unauthenticated socket
        return;
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        socket.uid = decodedToken.uid; // Attach UID to the socket object
        console.log(`User ${socket.uid} connected via Socket.IO`);
    } catch (error) {
        console.error('Error verifying Socket.IO token:', error);
        socket.disconnect(true); // Disconnect on token verification failure
        return;
    }

    //addActivity event from client
    socket.on('addActivity', async (event) => {
        console.log('Processing addActivity event:', event);
        // Ensure the userId in the event is the verified socket.uid
        const verifiedEvent = { ...event, userId: socket.uid };
        await addActivityEventToSupabase(verifiedEvent); // Update the activity event inside db
        const updatedActivityFeed = await getActivityFeedFromSupabase();// get from activity_feed table inside db
        io.emit('activityFeedUpdated', updatedActivityFeed); // we are emitting this 'activityFeedUpdated' and updated 'mockActivityFeed'  to all clients, not just our single client
    });

    //updateUserClipAndReign event from client
    socket.on('updateUserClipAndReign', async ({ userId, newClipUrl, newReignStart }) => {
        // Ensure the userId is the verified socket.uid
        if (userId !== socket.uid) {
            console.warn(`Attempted to update user ${userId} with unmatching socket.uid ${socket.uid}`);
            return; // Prevent unauthorized updates
        }
        console.log('Processing updateUserClipAndReign event:', { userId: socket.uid, newClipUrl, newReignStart });
        await updateUserClipAndReignInSupabase(socket.uid, newClipUrl, newReignStart); // we finds out current user, and update it in 'users', then also put it inside 'gameState' to set as reigning player
        const updatedUsers = await getUsersFromSupabase();
        const updatedGameState = await getGameStateFromSupabase();
        io.emit('usersUpdated', updatedUsers); // Broadcast updated users to every client
        io.emit('gameStateUpdated', updatedGameState); // Broadcast updated game state to every client
    });

    //dethroneUser event from client
    socket.on('dethroneUser', async ({ userId }) => {
        // Ensure the userId is the verified socket.uid
        if (userId !== socket.uid) {
            console.warn(`Attempted to dethrone user ${userId} with unmatching socket.uid ${socket.uid}`);
            return; // Prevent unauthorized actions
        }
        console.log('Processing dethroneUser event for userId:', socket.uid);
        await dethroneUserInSupabase(socket.uid); // Update data of dethroned reigning user in 'user' espeically their totalTimeHeld and currentReignStart to null
        const updatedUsers = await getUsersFromSupabase();
        io.emit('usersUpdated', updatedUsers); // Broadcast updated users data to everyone
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});