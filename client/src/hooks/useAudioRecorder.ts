import { useState, useRef, useEffect } from 'react';

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      // Consolidated onstop assignment
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(url);
        setIsRecording(false);
        mediaStreamRef.current?.getTracks().forEach(track => track.stop()); // <--- Added this line
        // No need for clearTimeout(timeoutId) here, as it's handled by the timeout itself
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      // Force stop after 10 seconds as a fallback
      setTimeout(() => { // Removed timeoutId assignment, as it's not cleared here
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') { // Check state before stopping
          mediaRecorderRef.current.stop();
        }
      }, 10000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      setIsRecording(false);
      mediaStreamRef.current?.getTracks().forEach(track => track.stop()); // <--- Also stop on error
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') { // Check state
      mediaRecorderRef.current.stop();
    }
    mediaStreamRef.current?.getTracks().forEach(track => track.stop()); // Always stop tracks
  };

  useEffect(() => {
    return () => {
      // Cleanup: stop any active media stream tracks when component unmounts
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      // Revoke object URL if it exists
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