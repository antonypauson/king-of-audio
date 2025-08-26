import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Trophy, Medal, Skull} from "lucide-react";
import { formatTime } from "@/lib/utils";
import { Flipper, Flipped } from 'react-flip-toolkit';

interface User {
  id: string;
  username: string;
  avatarUrl: string;
  totalTimeHeld: number;
  currentReignStart: number | null;
}

interface LeaderboardProps {
  users: User[];
  currentGameState: { currentUserId: string | null };
}

const getRankIcon = (rank: number, isCurrentReigning: boolean) => {
  if (isCurrentReigning) {
    return <Crown className="h-5 w-5 text-crown" />;
  }
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-orange-500" />;
    case 2:
    case 3:
      return <Medal className="h-5 w-5 text-muted-foreground" />;
    default:
      return <Skull className="h-6 w-6 text-muted-foreground" />; // Skull for others (increased size)
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

export default function Leaderboard({ users, currentGameState }: LeaderboardProps) {
  const players: Player[] = users
    .sort((a, b) => b.totalTimeHeld - a.totalTimeHeld)
    .map((user, index) => ({
      id: user.id,
      name: user.username,
      avatarUrl: user.avatarUrl,
      totalTimeHeld: user.totalTimeHeld,
      isCurrentReigning: user.id === currentGameState.currentUserId, // <--- CHANGE THIS LINE
      rank: index + 1,
    }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-start gap-2 mb-6">
        <Trophy className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
          Leaderboard
        </h2>
      </div>
      
      <Flipper flipKey={JSON.stringify(users.map(u => u.id + '-' + u.totalTimeHeld))} spring="gentle" staggerConfig={{ default: { speed: 0.9 } }}>
        <div className="space-y-2">
          {players.map((player) => (
            <Flipped key={player.id} flipId={player.id} shouldFlip={() => true}>
              <Card
                className={`w-full overflow-hidden p-2 transition-all duration-300 ${getRankStyle(player.rank, player.isCurrentReigning)}`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    {getRankIcon(player.rank, player.isCurrentReigning)}
                    <span className="text-sm font-bold text-muted-foreground">
                      {player.rank}
                    </span>
                  </div>

                  <Avatar className={`h-8 w-8 ${player.isCurrentReigning ? 'border-2 border-crown animate-reign-pulse' : ''}`}>
                    <AvatarImage src={player.avatarUrl} />
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground truncate mb-0.5">
                        {player.name}
                      </span>

                    </div>
                  </div>

                  <div className="text-right min-w-0">
                    <Badge
                      variant="secondary"
                      className={`text-xs px-1 py-0.5 whitespace-nowrap overflow-hidden text-ellipsis ${player.rank === 1 ? "bg-crown text-background" : ""}`}
                    >
                      {formatTime(player.totalTimeHeld)}
                    </Badge>
                  </div>
                </div>
              </Card>
            </Flipped>
          ))}
        </div>
      </Flipper>
    </div>
  );
}