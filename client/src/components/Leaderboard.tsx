import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Trophy, Medal, Star } from "lucide-react";

interface Player {
  id: string;
  name: string;
  avatar: string;
  initials: string;
  score: number;
  isCurrentReigning: boolean;
  rank: number;
}

const players: Player[] = [
  {
    id: '1',
    name: 'Alex Storm',
    avatar: '',
    initials: 'AS',
    score: 47,
    isCurrentReigning: true,
    rank: 1
  },
  {
    id: '2',
    name: 'Jordan Beats',
    avatar: '',
    initials: 'JB',
    score: 32,
    isCurrentReigning: false,
    rank: 2
  },
  {
    id: '3',
    name: 'Sam Melody',
    avatar: '',
    initials: 'SM',
    score: 28,
    isCurrentReigning: false,
    rank: 3
  },
  {
    id: '4',
    name: 'Riley Bass',
    avatar: '',
    initials: 'RB',
    score: 24,
    isCurrentReigning: false,
    rank: 4
  },
  {
    id: '5',
    name: 'Casey Vibe',
    avatar: '',
    initials: 'CV',
    score: 19,
    isCurrentReigning: false,
    rank: 5
  },
  {
    id: '6',
    name: 'Morgan Echo',
    avatar: '',
    initials: 'ME',
    score: 15,
    isCurrentReigning: false,
    rank: 6
  },
  {
    id: '7',
    name: 'Taylor Sound',
    avatar: '',
    initials: 'TS',
    score: 12,
    isCurrentReigning: false,
    rank: 7
  }
];

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
  
  switch (rank) {
    case 1:
      return "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-crown/30";
    case 2:
      return "bg-gradient-to-r from-gray-400/10 to-gray-500/10 border-gray-400/30";
    case 3:
      return "bg-gradient-to-r from-orange-600/10 to-orange-700/10 border-orange-500/30";
    default:
      return "bg-card border-border hover:bg-secondary/50";
  }
};

export default function Leaderboard() {
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
                <AvatarImage src={player.avatar} />
                <AvatarFallback className={`text-sm font-bold ${player.isCurrentReigning ? 'bg-gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                  {player.initials}
                </AvatarFallback>
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
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">
                    {player.score} wins
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <Badge 
                  variant={player.rank <= 3 ? "default" : "secondary"}
                  className={player.rank === 1 ? "bg-crown text-background" : ""}
                >
                  {player.score}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}