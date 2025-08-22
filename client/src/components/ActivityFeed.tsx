import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Mic, Timer, Trophy } from "lucide-react";

interface Activity {
  id: string;
  type: 'takeover' | 'record' | 'milestone';
  user: {
    name: string;
    avatar: string;
    initials: string;
  };
  description: string;
  timestamp: string;
}

const activities: Activity[] = [
  {
    id: '1',
    type: 'takeover',
    user: { name: 'Alex Storm', avatar: '', initials: 'AS' },
    description: 'took over with an epic beat drop!',
    timestamp: '2 min ago'
  },
  {
    id: '2',
    type: 'milestone',
    user: { name: 'Jordan Beats', avatar: '', initials: 'JB' },
    description: 'reached 5 audio wins milestone',
    timestamp: '5 min ago'
  },
  {
    id: '3',
    type: 'record',
    user: { name: 'Sam Melody', avatar: '', initials: 'SM' },
    description: 'recorded a new audio challenge',
    timestamp: '8 min ago'
  },
  {
    id: '4',
    type: 'takeover',
    user: { name: 'Riley Bass', avatar: '', initials: 'RB' },
    description: 'claimed the throne with sick vocals',
    timestamp: '12 min ago'
  },
  {
    id: '5',
    type: 'record',
    user: { name: 'Casey Vibe', avatar: '', initials: 'CV' },
    description: 'dropped a fresh audio clip',
    timestamp: '15 min ago'
  }
];

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'takeover':
      return <Crown className="h-4 w-4 text-crown" />;
    case 'record':
      return <Mic className="h-4 w-4 text-neon-blue" />;
    case 'milestone':
      return <Trophy className="h-4 w-4 text-neon-green" />;
    default:
      return <Timer className="h-4 w-4 text-muted-foreground" />;
  }
};

export default function ActivityFeed() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Timer className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
          Activity Feed
        </h2>
      </div>
      
      <div className="space-y-3">
        {activities.map((activity) => (
          <Card key={activity.id} className="p-3 bg-card border-border hover:bg-secondary/50 transition-colors">
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={activity.user.avatar} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                  {activity.user.initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getActivityIcon(activity.type)}
                  <span className="text-sm font-medium text-foreground">
                    {activity.user.name}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {activity.description}
                </p>
                <span className="text-xs text-muted-foreground mt-1 block">
                  {activity.timestamp}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}