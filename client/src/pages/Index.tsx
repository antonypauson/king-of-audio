import { useState, useCallback, useEffect, useRef } from "react";
import ActivityFeed from "@/components/ActivityFeed";
import AudioPlayer from "@/components/AudioPlayer";
import Leaderboard from "@/components/Leaderboard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { io } from 'socket.io-client'; // socket.io-client
import UsernameModal from '@/components/UsernameModal'; // Import UsernameModal
import { auth } from '../firebase'; // Import auth from firebase.ts
//removed mock data import from mockData.js, cause we are gonna use backend now for intial data. 

interface IndexProps {
  onDataLoaded: () => void; // New prop to signal App.tsx
}

const Index: React.FC<IndexProps> = ({ onDataLoaded }) => {
  //intially all these states are empty, as we are fetching it from backend endpoints
  const [activityFeed, setActivityFeed] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentGameState, setCurrentGameState] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); 
  const [isLoading, setIsLoading] = useState(true); 
  const [showUsernameModal, setShowUsernameModal] = useState(false); // New state for modal visibility 

  const socketRef = useRef(null); // Declare socketRef

  // Helper to get Firebase ID token and construct headers
  const getAuthHeaders = async () => {
    const user = auth.currentUser;
    if (user) {
      const idToken = await user.getIdToken();
      console.log("Firebase token: ", idToken);
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      };
    }
    return { 'Content-Type': 'application/json' }; // Fallback if no user (shouldn't happen for protected routes)
  };

  // Socket.IO connection and listeners
  useEffect(() => {
    const connectSocket = async () => {
      const user = auth.currentUser;
      let idToken = null;
      if (user) {
        idToken = await user.getIdToken();
      }

      socketRef.current = io('http://localhost:5000', {
        query: {
          token: idToken,
        },
      });

      socketRef.current.on('usersUpdated', (updatedUsers) => {
        setUsers(updatedUsers);
      });

      socketRef.current.on('gameStateUpdated', (updatedGameState) => {
        setCurrentGameState(updatedGameState);
      });

      socketRef.current.on('activityFeedUpdated', (updatedActivityFeed) => {
        console.log('Frontend received activityFeedUpdated:', updatedActivityFeed);
        setActivityFeed(updatedActivityFeed);
      });

      // Clean up socket listeners and disconnect on component unmount
      return () => {
        socketRef.current.off('usersUpdated');
        socketRef.current.off('gameStateUpdated');
        socketRef.current.off('activityFeedUpdated');
        socketRef.current.disconnect(); // Disconnect socket when component unmounts
      };
    };
    connectSocket(); // Call the async function
  }, []); // This is the dependency array for the outer useEffect

  //to add new activity card
  const handleNewActivityEvent = useCallback((newEvent: any) => {
    socketRef.current.emit('addActivity', newEvent); // Emit event to backend
  }, []); // No longer depends on 'socket', as socketRef.current is stable
  
  // to set current user as new reigning palyer
  const handleUpdateUserClipAndReign = useCallback((userId: string, newClipUrl: string, newReignStart: number) => {
    socketRef.current.emit('updateUserClipAndReign', { userId, newClipUrl, newReignStart }); // Emit event to backend
  }, []); // No longer depends on 'socket', as socketRef.current is stable

  // to update the dethroned player's time in 'users'
  const handleDethroneUser = useCallback((userId: string) => {
    socketRef.current.emit('dethroneUser', { userId }); // Emit event to backend
  }, []); // No longer depends on 'socket', as socketRef.current is stable

  const handleFindReigningUser = useCallback(() => {
    return users.find(user => user.currentReignStart !== null);
  }, [users]);

  //current user's info from Firebase auth.currentUser
  // This will be the actual authenticated user, combined with data from backend users array
  const firebaseUser = auth.currentUser;
  const currentUserData = firebaseUser ? (() => {
    const userFromBackend = users.find(u => u.id === firebaseUser.uid);
    const avatarSeed = firebaseUser.displayName || firebaseUser.uid;
    const generatedAvatarUrl = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${avatarSeed}`;

    if (userFromBackend) {
      // If user exists in backend, combine Firebase data with backend data
      return {
        ...userFromBackend,
        id: firebaseUser.uid, // Ensure ID is Firebase UID
        username: firebaseUser.displayName || userFromBackend.username, // Prefer Firebase displayName
        avatarUrl: generatedAvatarUrl, // Use generated avatar
      };
    } else {
      // If user not yet in backend (e.g., just signed up and set username), use Firebase data as primary
      return {
        id: firebaseUser.uid,
        username: firebaseUser.displayName || 'Guest',
        avatarUrl: generatedAvatarUrl,
        totalTimeHeld: 0, // Default for new users not yet in backend
        currentClipUrl: null,
        currentReignStart: null,
      };
    }
  })() : null;

  // fetching initial mock data from the backend
  useEffect(() => {
    const fetchData = async () => {
      try { //these states were null intially
        const headers = await getAuthHeaders();
        const [usersRes, gameStateRes, activityFeedRes] = await Promise.all([
          fetch('http://localhost:5000/api/users', { headers }),
          fetch('http://localhost:5000/api/current-game-state', { headers }),
          fetch('http://localhost:5000/api/activity-feed', { headers }),
          // Removed fetch for /api/current-user
        ]);

        const [usersData, gameStateData, activityFeedData] = await Promise.all([
          usersRes.json(),
          gameStateRes.json(),
          activityFeedRes.json(),
        ]);
        console.log("Index.tsx: Initial fetch - usersData:", usersData);
        console.log("Index.tsx: Initial fetch - gameStateData:", gameStateData);
        console.log("Index.tsx: Initial fetch - activityFeedData:", activityFeedData);

        setUsers(usersData);
        setCurrentGameState(gameStateData);
        setActivityFeed(activityFeedData);
        console.log("Index.tsx: State updated - users:", users);
        console.log("Index.tsx: State updated - currentGameState:", currentGameState);
        // setCurrentUser is now handled by firebaseUser directly or derived from usersData

        // Check if Firebase user has a display name
        if (firebaseUser) {
          // If user doesn't have a display name, show the modal
          if (!firebaseUser.displayName) {
            setShowUsernameModal(true);
          } else {
            // If user has a display name, ensure they are added to backend and trigger join event
            const avatarSeed = firebaseUser.displayName || firebaseUser.uid;
            const generatedAvatarUrl = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${avatarSeed}`;

            try {
              const addUserResponse = await fetch('http://localhost:5000/api/add-new-user', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                  id: firebaseUser.uid,
                  username: firebaseUser.displayName,
                  avatarUrl: generatedAvatarUrl,
                }),
              });

              if (!addUserResponse.ok) {
                const errorData = await addUserResponse.json();
                console.error("Error adding user to backend on login:", errorData);
              }
            } catch (err) {
              console.error("Network error adding user to backend on login:", err);
            }
          }
        }

      } catch (error) {
        console.error("Error fetching initial data:", error);
        // Handle error state appropriately
      } finally {
        setIsLoading(false); //when we fetched all data, isLoading is false
        onDataLoaded(); // Signal App.tsx that data is loaded so that we can control the ui when successfully signs in
      }
    };

    fetchData();
  }, [firebaseUser]); // Add firebaseUser to dependency array to re-run when user changes

  const handleUsernameSet = () => {
    setShowUsernameModal(false);
    // Force a re-render or re-check of the user's display name
    // A simple way is to update the currentUser state, which will trigger a re-render
    // No longer need to manually set currentUser here, as firebaseUser will update
    // and the derived currentUserData will reflect the change.
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className={`border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 ${showUsernameModal ? 'blur-sm' : ''}`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">🎵</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Audio Boy
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {currentUserData && (
                <div className="flex items-center gap-3 border border-primary rounded-sm px-3 py-1">
                  <Avatar className="h-8 w-8 border-2 border-primary">
                    <AvatarImage src={currentUserData.avatarUrl} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                      {currentUserData.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-base font-medium text-foreground">
                    {currentUserData.username}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {isLoading ? ( // loading message/animation
        <div className="flex justify-center items-center min-h-[calc(100vh-80px)] text-lg text-muted-foreground">
          Loading data... need to add skeleton or loading animation here
        </div>
      ) : (
        <main className={`container mx-auto px-6 py-8 ${showUsernameModal ? 'blur-sm' : ''}`}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-[calc(100vh-120px)]">
            {/* Left Sidebar - Activity Feed */}
            <aside className="lg:col-span-1">
              <div className="sticky top-32">
                <ActivityFeed activityFeed={activityFeed} users={users} />
              </div>
            </aside>

            {/* Center - Audio Player */}
            <section className="lg:col-span-2">
              <AudioPlayer //all the props inside AudioPlayer
                onNewActivityEvent={handleNewActivityEvent}
                updateUserClipAndReign={handleUpdateUserClipAndReign}
                dethroneUser={handleDethroneUser}
                findReigningUser={handleFindReigningUser}
                currentUser={currentUserData} // Pass currentUserData (Firebase user)
                currentGameState={currentGameState}
                users={users}
              />
            </section>

            {/* Right Sidebar - Leaderboard */}
            <aside className="lg:col-span-1">
              <div className="sticky top-32">
                <Leaderboard users={users} currentGameState={currentGameState} />
              </div>
            </aside>
          </div>
        </main>
      )}

      {showUsernameModal && auth.currentUser && (
        <UsernameModal user={auth.currentUser} onUsernameSet={handleUsernameSet} />
      )}
    </div>
  );
};

export default Index;