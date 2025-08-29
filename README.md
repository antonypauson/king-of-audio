# King of Audio
- A real time multiplayer web game where any user can dethrone a reigning king by recording an audio of less than 10s.
- The major features of the app are *live leaderboard*, *activity feed* and *persistent game state*.

### Features
- **Audio Battles**: record audio directly inside browser and dethrone others.
- **Reigning Player**: the last user who uploaded an audio stays the "KING".
- **Live Leaderboard**: see rankings instantly update by Socket.io.
- **Activity Feed**: there is an activity feed which shows three activities: "join", "dethrone" and "upload" based on user activities in real time.
- **Cloud Storage**: audio clips are stored inside *Supabase storage* via public URLS.
- **User Auth**: secure login and persistent identity, done using Supabase and Firebase.
- **Responsive UI**: is responsive, thanks to *Tailwind CSS*.

### Tech Stack
#### Frontend
- React + Vite
- Tailwind CSS
- socket.io client
#### Backend
- Node.js + Express
- socket.io server
- Firebase Admin SDK for authentication
- Supabase (Postgres + Auth + Storage)
#### Deployment
- **Client**: Vercel
- **Server**: Render
- **Database**: Supabase

### Set up
if you are interested in running the web app locally, 
#### 1. Clone the repo
```
git clone https://github.com/antonypauson/king-of-audio.git
cd king-of-audio
```
#### 2. Install Dependencies
##### **Client**
```
cd client
npm install
```
##### **Server**
```
cd server
npm install
```
#### 3. Set up Environment Variables
You have to set up environment variables inside `client/.env` and  `server/.env`. These can be obtained from the respective services
##### Client
```
VITE_SERVER_URL=http://localhost:5000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
##### Server
```
PORT=5000
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CLIPS_BUCKET=clips

# Firebase Admin (if using secret file, skip these)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```
#### 4. Run the app
##### Client
```
cd client
npm run dev
```
##### Server
```
cd server
node index.js
```
### Demo
Here's a demo I've recorded: 
https://youtu.be/bQrLONv5QPY

### Future Improvements
- Adding sound effects while new updates happen.
- Rate limiting for each user for spam prevention.
- Adding more events inside activity feed.

### Contributing
Fork the repo, create a branch and open a PR. I'll be happy to add your suggestions and fixes.
  

