import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Mic, Upload, Crown } from "lucide-react";
import { mockUsers, mockCurrentGameState } from "../data/mockData";

interface CurrentPlayer {
  name: string;
  avatar: string;
  initials: string;
  reignStartTime: Date;
}

export default function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [reignDuration, setReignDuration] = useState("");
  const [currentPlayer, setCurrentPlayer] = useState<CurrentPlayer | null>(null);

  useEffect(() => {
    const currentUser = mockUsers.find(user => user.id === mockCurrentGameState.currentUserId);
    if (currentUser) {
      setCurrentPlayer({
        name: currentUser.username,
        avatar: currentUser.avatarUrl,
        initials: currentUser.username.substring(0, 2).toUpperCase(),
        reignStartTime: new Date(mockCurrentGameState.reignStart),
      });
    }
  }, []);

  useEffect(() => {
    if (!currentPlayer) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = now.getTime() - currentPlayer.reignStartTime.getTime();
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setReignDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentPlayer]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  if (!currentPlayer) {
    return <div>Loading audio player...</div>; // Or a loading spinner
  }

  return (
    <Card className="p-8 bg-gradient-player border-border shadow-card">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          {/* <Crown className="h-5 w-5 text-crown animate-pulse-glow" /> */}
          <Crown className="h-8 w-8 text-crown drop-shadow-lg" />
        </div>
        <div className="relative mb-4">
          <Avatar className="h-24 w-24 mx-auto border-4 border-crown shadow-glow-reign animate-reign-pulse">
            <AvatarImage src={currentPlayer.avatar} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-bold">
              {currentPlayer.initials}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -top-2 -right-2"></div>
        </div>

        <h3 className="text-2xl font-bold text-foreground mb-1">
          {currentPlayer.name}
        </h3>

        <div className="flex items-center justify-center gap-2 mb-6">
          <Badge variant="secondary" className="text-sm">
            Reigning for {reignDuration}
          </Badge>
        </div>
      </div>

      {/* Audio Waveform Animation */}
      <div className="flex items-end justify-center gap-1 h-16 mb-8">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`w-2 bg-gradient-to-t from-neon-blue to-neon-purple rounded-full ${
              isPlaying ? "audio-wave" : "h-2"
            }`}
            style={{
              animationDelay: isPlaying ? `${i * 0.1}s` : undefined,
              height: isPlaying ? undefined : Math.random() * 50 + 10 + "%",
            }}
          />
        ))}
      </div>

      {/* Play Controls */}
      <div className="flex justify-center gap-4 mb-8">
        <Button
          size="lg"
          onClick={togglePlay}
          className="bg-gradient-primary hover:scale-105 transition-transform shadow-glow-primary"
        >
          {isPlaying ? (
            <Pause className="h-6 w-6 mr-2" />
          ) : (
            <Play className="h-6 w-6 mr-2" />
          )}
          {isPlaying ? "Pause" : "Play Audio"}
        </Button>
      </div>

      {/* Record/Upload Actions */}
      <div className="flex gap-3 justify-center">
        <Button
          variant="outline"
          size="lg"
          className="flex-1 max-w-48 border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-background transition-all duration-300 glow-primary"
        >
          <Mic className="h-5 w-5 mr-2" />
          Record Audio
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="flex-1 max-w-48 border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-background transition-all duration-300"
        >
          <Upload className="h-5 w-5 mr-2" />
          Upload Audio
        </Button>
      </div>
    </Card>
  );
}