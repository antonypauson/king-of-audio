import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Trophy, Medal, Star } from "lucide-react";
import { formatTime } from "@/lib/utils";

interface User {
  id: string;
  username: string;
  avatarUrl: string;
  totalTimeHeld: number;
  currentReignStart: number | null;
}

interface Player {
  id: string;
  name: string;
  avatarUrl: string;
  totalTimeHeld: number;
  isCurrentReigning: boolean;
  rank: number;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-crown" />;
    case 2:
      return <Medal className="h-5 w-5 text-muted-foreground" />;
    case 3:
      return <Trophy className="h-5 w-5 text-orange-500" />;
    default:
      return <Star className="h-4 w-4 text-muted-foreground" />;
  }
};

const getRankStyle = (rank: number, isCurrentReigning: boolean) => {
  if (isCurrentReigning) {
    return "bg-gradient-reign border-reign glow-reign";
  }
  if (rank === 1) {
    return "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-crown/30";
  }
  return "bg-card border-border hover:bg-secondary/50";
};

export default function Leaderboard({ users }: { users: User[] }) {
  const players: Player[] = users
    .sort((a, b) => b.totalTimeHeld - a.totalTimeHeld)
    .map((user, index) => ({
      id: user.id,
      name: user.username,
      avatarUrl: user.avatarUrl,
      totalTimeHeld: user.totalTimeHeld,
      isCurrentReigning: user.currentReignStart !== null,
      rank: index + 1,
    }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
          Leaderboard
        </h2>
      </div>
      
      <div className="space-y-2">
        {players.map((player) => (
          <Card 
            key={player.id} 
            className={`p-3 transition-all duration-300 ${getRankStyle(player.rank, player.isCurrentReigning)}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 min-w-[2rem]">
                {getRankIcon(player.rank)}
                <span className="text-sm font-bold text-muted-foreground">
                  {player.rank}
                </span>
              </div>
              
              <Avatar className={`h-10 w-10 ${player.isCurrentReigning ? 'border-2 border-crown animate-reign-pulse' : ''}`}>
                <AvatarImage src={player.avatarUrl} />
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground truncate">
                    {player.name}
                  </span>
                  {player.isCurrentReigning && (
                    <Badge className="bg-gradient-primary text-primary-foreground text-xs">
                      REIGNING
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <Badge 
                  variant="secondary"
                  className={player.rank === 1 ? "bg-crown text-background" : ""}
                >
                  {formatTime(player.totalTimeHeld)}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}