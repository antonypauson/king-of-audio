import { useState, useRef, useEffect } from 'react';
import { useToast } from '../components/ui/use-toast'; // Import useToast

interface AudioRecorderHook {
  isRecording: boolean;
  audioBlobUrl: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

export const useAudioRecorder = (): AudioRecorderHook => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast(); // Initialize useToast

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const preferredMimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' :
                                MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';

      if (!preferredMimeType) {
        throw new Error('No supported audio MIME type found for MediaRecorder.');
      }

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: preferredMimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      let timeoutId: NodeJS.Timeout; // Declare timeoutId here

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: preferredMimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(url);
        setIsRecording(false);
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        clearTimeout(timeoutId); // Clear timeout on manual stop
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      // Force stop after 10 seconds as a fallback
      timeoutId = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      }, 10000);

    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      let errorMessage = "";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = "Microphone access denied. Please allow microphone access in your browser settings.";
      } else if (err.name === 'NotFoundError') {
        errorMessage = "No microphone found. Please ensure a microphone is connected and enabled.";
      } else if (err.name === 'NotReadableError') {
        errorMessage = "Microphone is in use by another application. Please close other apps and try again.";
      } else {
        errorMessage = `Error accessing microphone: ${err.message || err.name}`;
      }
      toast({
        title: "Recording Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsRecording(false);
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
  };

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioBlobUrl) {
        URL.revokeObjectURL(audioBlobUrl);
      }
    };
  }, []);

  return {
    isRecording,
    audioBlobUrl,
    startRecording,
    stopRecording,
  };
};