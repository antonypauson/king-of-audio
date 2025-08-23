import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Mic, Upload, Crown } from "lucide-react";
import { mockUsers, mockCurrentGameState, mockCurrentUser } from "../data/mockData";
import { useAudioRecorder } from "../hooks/useAudioRecorder";

interface CurrentPlayer {
  name: string;
  avatar: string;
  initials: string;
  reignStartTime: Date;
  currentClipUrl: string;
}

export default function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [reignDuration, setReignDuration] = useState("");
  const [reigningPlayer, setReigningPlayer] = useState<CurrentPlayer | null>(null);

  const { isRecording, audioBlobUrl, startRecording, stopRecording } = useAudioRecorder();

  useEffect(() => {
    const currentUser = mockUsers.find(user => user.id === mockCurrentGameState.currentUserId);
    if (currentUser) {
      setReigningPlayer({
        name: currentUser.username,
        avatar: currentUser.avatarUrl,
        initials: currentUser.username.substring(0, 2).toUpperCase(),
        reignStartTime: new Date(mockCurrentGameState.reignStart),
        currentClipUrl: currentUser.currentClipUrl,
      });
    }
  }, []);

  useEffect(() => {
    if (!reigningPlayer) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = now.getTime() - reigningPlayer.reignStartTime.getTime();
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setReignDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [reigningPlayer]);

  useEffect(() => {
    if (audioBlobUrl) {
      console.log("New audio URL:", audioBlobUrl);
      // Simulate updating mockUsers
      // Corrected logic: Update currentClipUrl for the user whose ID matches mockCurrentUser's ID.
      // This ensures the recorded audio is associated with the designated current user.
      const updatedMockUsers = mockUsers.map(user => {
        if (user.id === mockCurrentUser.id) {
          return { ...user, currentClipUrl: audioBlobUrl };
        }
        return user;
      });
      console.log("Simulated updated mockUsers:", updatedMockUsers);

      // Update reigningPlayer state with the new audioBlobUrl
      setReigningPlayer(prevPlayer => {
        if (prevPlayer) {
          return { ...prevPlayer, currentClipUrl: audioBlobUrl };
        }
        return null;
      });
    }
  }, [audioBlobUrl]);

  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.src = reigningPlayer.currentClipUrl; // Set src to currentClipUrl
        audioRef.current.play().catch(e => console.error("Error playing audio:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (!reigningPlayer) {
    return <div>Loading audio player...</div>; // Or a loading spinner
  }

  return (
    <Card className="p-8 bg-gradient-player border-border shadow-card glowing-border">
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          {/* <Crown className="h-5 w-5 text-crown animate-pulse-glow" /> */}
          <Crown className="h-8 w-8 text-crown drop-shadow-lg" />
        </div>
        <div className="relative mb-4">
          <Avatar className="h-24 w-24 mx-auto border-4 border-crown shadow-glow-reign animate-reign-pulse">
            <AvatarImage src={reigningPlayer.avatar} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-bold">
              {reigningPlayer.initials}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -top-2 -right-2"></div>
        </div>

        <h3 className="text-2xl font-bold text-foreground mb-1">
          {reigningPlayer.name}
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

      {/* Play Controls and Record/Upload Actions */}
      <div className="flex gap-3 justify-center mb-8">
        <Button
          size="lg"
          onClick={togglePlay}
          className="w-[180px] bg-gradient-primary hover:scale-105 transition-transform shadow-glow-primary"
        >
          {isPlaying ? (
            <Pause className="h-6 w-6 mr-2" />
          ) : (
            <Play className="h-6 w-6 mr-2" />
          )}
          {isPlaying ? "Pause" : "Play Audio"}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={isRecording ? stopRecording : startRecording}
          className="w-[180px] border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-background transition-all duration-300 glow-primary"
        >
          <Mic className="h-5 w-5 mr-2" />
          {isRecording ? "Stop Recording" : "Record Audio"}
        </Button>
      </div>
    </Card>
  );
}