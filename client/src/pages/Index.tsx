import { useState, useCallback, useEffect } from "react";
import ActivityFeed from "@/components/ActivityFeed";
import AudioPlayer from "@/components/AudioPlayer";
import Leaderboard from "@/components/Leaderboard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
//removed mock data import from mockData.js, cause we are gonna use backend now for intial data. 

const Index = () => {
  //intially all these states are empty, as we are fetching it from backend endpoints
  const [activityFeed, setActivityFeed] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentGameState, setCurrentGameState] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); 
  const [isLoading, setIsLoading] = useState(true); 

  const handleNewActivityEvent = useCallback((newEvent: any) => {
    setActivityFeed((prev) => [...prev, newEvent]);
  }, [setActivityFeed]);

  const handleUpdateUserClipAndReign = useCallback((userId: string, newClipUrl: string, newReignStart: number) => {
    setUsers(prevUsers => {
      const updatedUsers = prevUsers.map(user => {
        if (user.id === userId) {
          return { ...user, currentClipUrl: newClipUrl, currentReignStart: newReignStart };
        }
        return user;
      });
      return updatedUsers;
    });
    setCurrentGameState(prevState => ({
      ...prevState,
      currentUserId: userId,
      currentClipUrl: newClipUrl,
      reignStart: newReignStart,
    }));
  }, []);

  const handleDethroneUser = useCallback((userId: string) => {
    setUsers(prevUsers => {
      const updatedUsers = prevUsers.map(user => {
        if (user.id === userId && user.currentReignStart !== null) {
          const reignDuration = Date.now() - user.currentReignStart;
          return {
            ...user,
            totalTimeHeld: user.totalTimeHeld + Math.floor(reignDuration / 1000),
            currentReignStart: null
          };
        }
        return user;
      });
      return updatedUsers;
    });
  }, []);

  const handleFindReigningUser = useCallback(() => {
    return users.find(user => user.currentReignStart !== null);
  }, [users]);

  //current user's info from our 'user' array extraction
  const currentUserData = users.find(user => user.id === currentUser?.id);

  // fetching initial mock data from the backend
  useEffect(() => {
    const fetchData = async () => {
      try { //these states were null intially
        const [usersRes, gameStateRes, activityFeedRes, currentUserRes] = await Promise.all([
          fetch('http://localhost:5000/api/users'),
          fetch('http://localhost:5000/api/current-game-state'),
          fetch('http://localhost:5000/api/activity-feed'),
          fetch('http://localhost:5000/api/current-user'), //all the links for the back end fetching. Now we have the mock data. 
        ]);

        const [usersData, gameStateData, activityFeedData, currentUserData] = await Promise.all([
          usersRes.json(),
          gameStateRes.json(),
          activityFeedRes.json(),
          currentUserRes.json(),
        ]);

        setUsers(usersData);
        setCurrentGameState(gameStateData);
        setActivityFeed(activityFeedData);
        setCurrentUser(currentUserData);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        // Handle error state appropriately
      } finally {
        setIsLoading(false); //when we fetched all data, isLoading is false
      }
    };

    fetchData();
  }, []); // Empty dependency array means this runs once on mount

  // Effect to update totalTimeHeld for the reigning player dynamically
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const reigningUser = users.find(user => user.id === currentGameState?.currentUserId); // Use optional chaining

    if (reigningUser && reigningUser.currentReignStart !== null) {
      intervalId = setInterval(() => {
        setUsers(prevUsers => {
          return prevUsers.map(user => {
            if (user.id === reigningUser.id) {
              // Calculate elapsed time since reign started
              const elapsedSeconds = Math.floor((Date.now() - reigningUser.currentReignStart!) / 1000);
              // Add to totalTimeHeld, ensuring we don't double count if already updated
              // This approach ensures totalTimeHeld is always accurate based on current reign start
              return { ...user, totalTimeHeld: user.totalTimeHeld + 1 }; // Increment by 1 second
            }
            return user;
          });
        });
      }, 1000); // Update every second
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [users, currentGameState]); // Dependencies: re-run if users or currentGameState changes

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
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
        <main className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-[calc(100vh-120px)]">
            {/* Left Sidebar - Activity Feed */}
            <aside className="lg:col-span-1">
              <div className="sticky top-32">
                <ActivityFeed activityFeed={activityFeed} />
              </div>
            </aside>

            {/* Center - Audio Player */}
            <section className="lg:col-span-2">
              <AudioPlayer //all the props inside AudioPlayer
                onNewActivityEvent={handleNewActivityEvent}
                updateUserClipAndReign={handleUpdateUserClipAndReign}
                dethroneUser={handleDethroneUser}
                findReigningUser={handleFindReigningUser}
                currentUser={currentUser}
                currentGameState={currentGameState}
                users={users}
              />
            </section>

            {/* Right Sidebar - Leaderboard */}
            <aside className="lg:col-span-1">
              <div className="sticky top-32">
                <Leaderboard users={users} />
              </div>
            </aside>
          </div>
        </main>
      )}
    </div>
  );
};

export default Index;