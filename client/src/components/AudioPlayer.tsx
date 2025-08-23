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
  const [isAudioContextReady, setIsAudioContextReady] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

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
      // Simulate updating mockUsers
      // Corrected logic: Update currentClipUrl for the user whose ID matches mockCurrentUser's ID.
      // This ensures the recorded audio isF associated with the designated current user.
      const updatedMockUsers = mockUsers.map(user => {
        if (user.id === mockCurrentUser.id) {
          return { ...user, currentClipUrl: audioBlobUrl };
        }
        return user;
      });

      // Update reigningPlayer state with the new audioBlobUrl
      setReigningPlayer(prevPlayer => {
        if (prevPlayer) {
          return { ...prevPlayer, currentClipUrl: audioBlobUrl };
        }
        return null;
      });

      // If we are in a playing state and audioBlobUrl just updated (meaning a recording just finished)
      // then play the newly recorded audio.
      if (isPlaying && audioRef.current) {
        audioRef.current.src = audioBlobUrl;
        audioRef.current.onloadeddata = () => {
          audioRef.current?.play().catch(e => console.error("Error playing new audio:", e));
        };
      }
    }
  }, [audioBlobUrl, isPlaying]);

  useEffect(() => {
    if (!audioRef.current) return;

    // Initialize AudioContext and source node only once
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      analyserRef.current.fftSize = 2048; // Adjust for desired detail
      setIsAudioContextReady(true);
    }

    return () => {
      // Clean up AudioContext on component unmount
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
        analyserRef.current = null;
        sourceRef.current = null;
      }
    };
  }, [audioRef.current]); // eslint-disable-line react-hooks/exhaustive-deps // Dependency on audioRef.current to ensure audio element is available

  useEffect(() => {
    if (!isAudioContextReady || !analyserRef.current || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let animationFrameId: number;

    const drawWaveform = () => {
      animationFrameId = requestAnimationFrame(drawWaveform);

      analyserRef.current!.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Set canvas dimensions to match CSS for proper scaling
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      ctx.lineWidth = 2;
      // Use a gradient similar to the original design
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#8A2BE2'); // Neon Purple
      gradient.addColorStop(1, '#00FFFF'); // Neon Blue
      ctx.strokeStyle = gradient;

      ctx.beginPath();

      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    drawWaveform();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [analyserRef, canvasRef, isAudioContextReady]); // Dependencies on analyserRef, canvasRef, and isAudioContextReady

  

  

  

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false); // Explicitly set to false when pausing
      } else {
        if (isRecording) {
          stopRecording(); // This will eventually update audioBlobUrl
          // DO NOT set src and play here immediately.
          // The useEffect for audioBlobUrl will handle playing the new audio.
          setIsPlaying(true); // Set isPlaying to true, so useEffect knows to play
          return; // Exit to let useEffect handle the play
        }
        // If not recording, proceed to play current clip
        audioRef.current.src = reigningPlayer.currentClipUrl; // Set src to currentClipUrl
        audioRef.current.onloadeddata = () => {
          audioRef.current?.play().catch(e => console.error("Error playing audio:", e));
        };
        setIsPlaying(true);
      }
    }
  };

  if (!reigningPlayer) {
    return <div>Loading audio player...</div>; // Or a loading spinner
  }

  return (
    <Card className={`p-8 bg-gradient-player border-border shadow-card ${
      isRecording ? 'glowing-border-recording' : isPlaying ? 'glowing-border-playing' : 'glowing-border'
    }`}>
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

      {/* Dynamic Audio Waveform */}
      <canvas ref={canvasRef} className="w-full h-16 mb-8"></canvas>

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
          onClick={() => {
            if (isRecording) {
              stopRecording();
            } else {
              if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
              }
              startRecording();
            }
          }}
          className={`w-[180px] transition-all duration-300 glow-primary ${
            isRecording
              ? "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              : "border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-background"
          }`}
        >
          <Mic className="h-5 w-5 mr-2" />
          {isRecording ? "Stop Recording" : "Record Audio"}
        </Button>
      </div>
    </Card>
  );
}