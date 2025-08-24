import { useState, useCallback } from "react";
import ActivityFeed from "@/components/ActivityFeed";
import AudioPlayer from "@/components/AudioPlayer";
import Leaderboard from "@/components/Leaderboard";
import { initialMockActivityFeed, mockUsers, mockCurrentGameState, dethroneUser, updateMockUserClipAndReign, findReigningUser, mockCurrentUser } from "../data/mockData";

const Index = () => {
  const [activityFeed, setActivityFeed] = useState(initialMockActivityFeed);
  const [users, setUsers] = useState(mockUsers);
  const [currentGameState, setCurrentGameState] = useState(mockCurrentGameState);

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
              <span className="text-sm text-muted-foreground">
                The ultimate audio battle arena
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
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
            <AudioPlayer
              onNewActivityEvent={handleNewActivityEvent}
              updateUserClipAndReign={handleUpdateUserClipAndReign}
              dethroneUser={handleDethroneUser}
              findReigningUser={handleFindReigningUser}
              currentUser={mockCurrentUser}
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
    </div>
  );
};

export default Index;