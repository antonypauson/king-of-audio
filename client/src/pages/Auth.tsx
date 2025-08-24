import React from 'react';
import { auth } from '../firebase'; // Import auth from your firebase.ts
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from '@/components/ui/button'; // Assuming you have a Button component

interface AuthProps {
  onLoginSuccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      console.log("Google login successful!");
      onLoginSuccess(); // Call the callback on successful login
    } catch (error) {
      console.error("Error during Google login:", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-8">King of Audio</h1>
        <Button
          onClick={handleGoogleLogin}
          className="bg-gradient-primary hover:scale-105 transition-transform shadow-glow-primary text-lg px-8 py-6"
        >
          Sign in with Google
        </Button>
      </div>
    </div>
  );
};

export default Auth;
