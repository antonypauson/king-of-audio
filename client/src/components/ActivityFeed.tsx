import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Mic, Timer, Trophy, XCircle, Swords, LogIn } from "lucide-react";

import { usersMap as initialUsersMap, formatActivity } from "@/data/mockData"; 
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css'; 

interface ActivityEvent {
  id: string;
  type: 'takeover' | 'upload' | 'failed' | 'dethroned' | 'join'; // Only 'uplod', 'dethroned' and 'join' work for now
  userId: string;
  targetUserId?: string;
  timestamp: number;
}

interface User {
  id: string;
  username: string;
  avatarUrl: string;
  totalTimeHeld: number;
  currentClipUrl: string | null;
  currentReignStart: number | null;
}

// Accept activityFeed and users as props
export default function ActivityFeed({ activityFeed, users }: { activityFeed: ActivityEvent[]; users: User[] }) { // Added users prop
  // Create usersMap dynamically from the users prop
  const usersMap: { [key: string]: User } = users.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {});

  const activities: ActivityEvent[] = [...activityFeed].sort((a, b) => b.timestamp - a.timestamp); // Used prop

  const getActivityIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'takeover':
        return <Crown className="h-4 w-4 text-crown" />;
      case 'upload':
        return <Mic className="h-4 w-4 text-neon-blue" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'dethroned':
        return <Swords className="h-4 w-4 text-muted-foreground" />;
      case 'join': // New join event icon
        return <LogIn className="h-4 w-4 text-primary" />;
      default:
        return <Timer className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityCardStyle = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'takeover':
        return "border-crown/30";
      case 'upload':
        return "border-neon-green/30";
      case 'failed':
        return "border-destructive/30";
      case 'dethroned':
        return "border-primary/30";
      case 'join': 
        return "border-destructive/30";
      default:
        return "border-border";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Timer className="h-5 w-5 text-primary" />
        <h2 className="text-base sm:text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
          Activity Feed
        </h2>
      </div>

      <SimpleBar style={{ maxHeight: 500 }} data-simplebar-direction="rtl">
        <div className="space-y-3 pl-3">
          {activities.map((event) => {
            const user = usersMap[event.userId];
            if (!user) return null; // Handle case where user might not be found

            return (
              <Card key={event.id} className={`p-3 transition-colors hover:bg-secondary/50 ${getActivityCardStyle(event.type)}`}>
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getActivityIcon(event.type)}
                      <span className="text-xs sm:text-sm font-medium text-foreground">
                        {user.username}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {formatActivity(event, usersMap)}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </SimpleBar>
    </div>
  );
}