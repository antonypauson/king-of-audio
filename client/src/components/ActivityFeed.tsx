import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Mic, Timer, Trophy, XCircle, Swords } from "lucide-react";

import { usersMap, formatActivity } from "@/data/mockData"; 

interface ActivityEvent {
  id: string;
  type: 'takeover' | 'upload' | 'failed' | 'dethroned';
  userId: string;
  targetUserId?: string;
  timestamp: number;
}

// Accept activityFeed as a prop
export default function ActivityFeed({ activityFeed }: { activityFeed: ActivityEvent[] }) { // Added prop
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
      default:
        return "border-border";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Timer className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
          Activity Feed
        </h2>
      </div>

      <div className="space-y-3">
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
                    <span className="text-sm font-medium text-foreground">
                      {user.username}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {formatActivity(event, usersMap)}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}