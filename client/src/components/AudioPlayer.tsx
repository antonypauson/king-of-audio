import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Mic, Upload, Crown } from "lucide-react";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { auth } from '../firebase'; // Import auth

interface User {
  id: string;
  username: string;
  avatarUrl: string;
  totalTimeHeld: number;
  currentClipUrl: string;
  currentReignStart: number | null;
}

interface GameState {
  currentUserId: string;
  currentClipUrl: string;
  reignStart: number;
}

interface CurrentPlayer {
  name: string;
  avatar: string;
  initials: string;
  reignStartTime: Date;
  currentClipUrl: string;
}

interface AudioPlayerProps {
  onNewActivityEvent: (event: any) => void;
  updateUserClipAndReign: (userId: string, newClipUrl: string, newReignStart: number) => void;
  dethroneUser: (userId: string) => void;
  currentUser: User;
  currentGameState: GameState;
  users: User[];
}

export default function AudioPlayer({
  onNewActivityEvent,
  updateUserClipAndReign,
  dethroneUser,
  currentUser,
  currentGameState,
  users,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [reignDuration, setReignDuration] = useState("");
  const [reigningPlayer, setReigningPlayer] = useState<CurrentPlayer | null>(null);
  const [isAudioContextReady, setIsAudioContextReady] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const { isRecording, audioBlobUrl, startRecording, stopRecording } = useAudioRecorder();

  useEffect(() => {
    const reigningUser = users.find(user => user.id === currentGameState.currentUserId);
    if (reigningUser) {
      setReigningPlayer({
        name: reigningUser.username,
        avatar: reigningUser.avatarUrl,
        initials: reigningUser.username.substring(0, 2).toUpperCase(),
        reignStartTime: new Date(currentGameState.reignStart),
        currentClipUrl: reigningUser.currentClipUrl,
      });
    }
  }, [currentGameState, users]);

  // New useEffect to update audio source when reigningPlayer.currentClipUrl changes
  useEffect(() => {
    if (audioRef.current && reigningPlayer?.currentClipUrl) {
      const urlWithCacheBuster = `${reigningPlayer.currentClipUrl}?t=${Date.now()}`;
      console.log("AudioPlayer.tsx: Updating audioRef.current.src to:", urlWithCacheBuster);
      audioRef.current.src = urlWithCacheBuster;
    } else {
        console.log("AudioPlayer.tsx: audioRef.current or reigningPlayer?.currentClipUrl is not ready.");
    }
  }, [reigningPlayer?.currentClipUrl]); // Removed isPlaying from dependencies as it's no longer used for playback here

  const initializeAudioContext = () => {
    if (audioRef.current && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      if (!sourceRef.current) {
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
        sourceRef.current.connect(analyserRef.current);
      }
      
      analyserRef.current.connect(audioContextRef.current.destination);
      analyserRef.current.fftSize = 2048;
      setIsAudioContextReady(true);
    }
  };

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

  const processedAudioBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const uploadAudio = async () => {
      if (audioBlobUrl && audioBlobUrl !== processedAudioBlobUrlRef.current) {
        processedAudioBlobUrlRef.current = audioBlobUrl;

        try {
          const audioBlob = await fetch(audioBlobUrl).then(r => r.blob());
          const formData = new FormData();
          // Use a fixed filename for the server to overwrite
          formData.append('audioFile', audioBlob, 'king_of_audio.webm'); 

          const idToken = await auth.currentUser?.getIdToken();

          const response = await fetch(
            "https://king-of-audio.onrender.com/api/upload-audio",
            {
              method: "POST",
              body: formData,
              headers: {
                Authorization: `Bearer ${idToken}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          const publicAudioUrl = data.publicUrl; // Get the public URL from the server
          console.log("AudioPlayer.tsx: Upload successful, publicAudioUrl:", publicAudioUrl);

          console.log("AudioPlayer.tsx: currentGameState.currentUserId:", currentGameState.currentUserId);
          console.log("AudioPlayer.tsx: currentUser.id:", currentUser.id);
          const isCurrentUserReigning = currentGameState.currentUserId === currentUser.id;
          console.log("AudioPlayer.tsx: isCurrentUserReigning:", isCurrentUserReigning);

          let dethronedUser = null;
          if (!isCurrentUserReigning && currentGameState && currentGameState.currentUserId) {
            dethronedUser = users.find(user => user.id === currentGameState.currentUserId);
            if (dethronedUser) {
              console.log("AudioPlayer.tsx: Dethroning user with ID:", dethronedUser.id);
              dethroneUser(dethronedUser.id);
            }
          }

          // Use the publicAudioUrl here
          updateUserClipAndReign(currentUser.id, publicAudioUrl, Date.now());

          let newActivityEvents = [];
          if (dethronedUser) {
            const now = Date.now();
            newActivityEvents.push({
              id: `event_${now}_dethroned`,
              type: "dethroned",
              userId: currentUser.id,
              targetUserId: dethronedUser.id,
              timestamp: now,
            });
          } else {
            newActivityEvents.push({
              id: `event_${Date.now()}`,
              type: "upload",
              userId: currentUser.id,
              timestamp: Date.now(),
            });
          }

          newActivityEvents.forEach(event => {
            onNewActivityEvent(event);
            console.log(`Added new '${event.type}' event to mockActivityFeed via prop.`);
          });

          setReigningPlayer(prevPlayer => {
            if (prevPlayer) {
              return { ...prevPlayer, currentClipUrl: publicAudioUrl }; // Update with public URL
            }
            return null;
          });

          if (isPlaying && audioRef.current) {
            // Removed automatic playback of new audio to comply with mobile autoplay policies.
            // The user will need to click the 'Play Audio' button to hear the new clip.
            // audioRef.current.src = publicAudioUrl; // Play the public URL
            // audioRef.current.onloadeddata = () => {
            //   audioRef.current?.play().catch(e => console.error("Error playing new audio:", e));
            // };
          }
        } catch (error) {
          console.error("Error uploading audio:", error);
          // Handle error, e.g., show a toast notification
        }
      }
    };

    uploadAudio();
  }, [audioBlobUrl, onNewActivityEvent, currentUser, currentGameState, dethroneUser, updateUserClipAndReign, isPlaying, users]);

  

  useEffect(() => {
    if (!analyserRef.current || !audioContextRef.current) return;

    if (isRecording) {
      // Disconnect existing audio element source if connected
      if (sourceRef.current) {
        sourceRef.current.disconnect(analyserRef.current);
      }
      // Disconnect analyser from destination to prevent microphone feedback
      if (analyserRef.current && audioContextRef.current) {
        analyserRef.current.disconnect(audioContextRef.current.destination);
      }

      // Start recording: connect microphone
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          mediaStreamSourceRef.current = audioContextRef.current!.createMediaStreamSource(stream);
          mediaStreamSourceRef.current.connect(analyserRef.current!);
          // Store the stream so we can stop it later
          mediaStreamSourceRef.current.mediaStream = stream;
        })
        .catch(err => {
          console.error("Error accessing microphone:", err);
        });
    } else {
      // Stop recording: reconnect audio element source
      // Disconnect microphone source if it exists
      if (mediaStreamSourceRef.current) {
        mediaStreamSourceRef.current.disconnect(analyserRef.current!);
        // Stop all tracks in the stream
        mediaStreamSourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
        mediaStreamSourceRef.current = null;
      }

      // Reconnect audio element source if it exists and is not already connected
      if (sourceRef.current) {
        sourceRef.current.connect(analyserRef.current!);
      }
      // Reconnect analyser to destination for playback
      if (analyserRef.current && audioContextRef.current) {
        analyserRef.current.connect(audioContextRef.current.destination);
      }
    }

    // Cleanup function for this useEffect
    return () => {
      if (mediaStreamSourceRef.current) {
        mediaStreamSourceRef.current.disconnect(analyserRef.current!);
        mediaStreamSourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
        mediaStreamSourceRef.current = null;
      }
      // Ensure audio element source is reconnected if component unmounts while not recording
      if (!isRecording && sourceRef.current) {
        sourceRef.current.connect(analyserRef.current!);
      }
    };
  }, [isRecording, analyserRef, audioContextRef, sourceRef]); // Dependencies

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
      if (isRecording) {
        ctx.strokeStyle = '#FF0000'; // Red for recording
      } else {
        // Use a gradient similar to the original design
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#8A2BE2'); // Neon Purple
        gradient.addColorStop(1, '#00FFFF'); // Neon Blue
        ctx.strokeStyle = gradient;
      }

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
  }, [analyserRef, canvasRef, isAudioContextReady, isRecording]); // Dependencies on analyserRef, canvasRef, isAudioContextReady, and isRecording

  

  

  

  const togglePlay = async () => {
    initializeAudioContext(); // Initialize AudioContext on user gesture
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        if (isRecording) {
          stopRecording();
          setIsPlaying(true); 
          return; 
        }
        try {
          const urlWithCacheBuster = `${reigningPlayer.currentClipUrl}?t=${Date.now()}`;
          console.log("AudioPlayer.tsx: togglePlay - setting audioRef.current.src to:", urlWithCacheBuster);
          audioRef.current.src = urlWithCacheBuster;
          audioRef.current.load(); // Explicitly load the audio
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (e) {
          console.error("Error playing audio:", e);
          setIsPlaying(false); // Reset playing state on error
        }
      }
    }
  };

  if (!reigningPlayer) {
    return (
      <Card className="p-4 sm:p-6 lg:p-8 bg-gradient-player border-border shadow-card text-center">
        <h3 className="text-2xl font-bold text-foreground mb-4">No King of Audio Yet!</h3>
        <p className="text-muted-foreground mb-6">Be the first to upload an audio clip and claim the crown.</p>
        <Button
          size="lg"
          onClick={() => {
            // Logic to start recording or guide the user
            // This might involve emitting a socket event or setting a state
            // For now, just a placeholder
            console.log("Prompting user to record audio...");
          }}
          className="w-[180px] bg-gradient-primary hover:scale-105 transition-transform shadow-glow-primary"
        >
          <Mic className="h-6 w-6 mr-2" />
          Start Recording
        </Button>
      </Card>
    );
  }

  return (
    <Card className={`p-4 sm:p-6 lg:p-8 bg-gradient-player border-border shadow-card ${
      isRecording ? 'glowing-border-recording' : isPlaying ? 'glowing-border-playing' : 'glowing-border'
    }`}>
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} crossOrigin="anonymous" />
      <div className="text-center mb-4 sm:mb-6">
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
      <div className="flex flex-wrap gap-3 justify-center mb-8">
        <Button
          size="lg"
          onClick={togglePlay}
          className="flex-1 bg-gradient-primary hover:scale-105 transition-transform shadow-glow-primary"
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
            initializeAudioContext(); // Initialize AudioContext on user gesture
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
          className={`flex-1 transition-all duration-300 glow-primary ${
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