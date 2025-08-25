import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; 
interface AuthProps {
  onLoginSuccess: () => void;
}

const memeMap: { [key: string]: string } = { //here are the embedded meme links from GIPHY
  "Default": "<div style=\"width:100%;height:0;padding-bottom:56%;position:relative;\"><iframe src=\"https://giphy.com/embed/hrpjWzFIbOjkxltbBG\" width=\"100%\" height=\"100%\" style=\"position:absolute\" frameBorder=\"0\" class=\"giphy-embed\" allowFullScreen></iframe></div>",
  "Successful Sign-Up": "<div style=\"width:100%;height:0;padding-bottom:57%;position:relative;\"><iframe src=\"https://giphy.com/embed/kGvCaZlPCpPreQoCha\" width=\"100%\" height=\"100%\" style=\"position:absolute\" frameBorder=\"0\" class=\"giphy-embed\" allowFullScreen></iframe></div>",
  "Invalid Credentials": "<div style=\"width:100%;height:0;padding-bottom:75%;position:relative;\"><iframe src=\"https://giphy.com/embed/YUG7qlbCeRutqL1jPU\" width=\"100%\" height=\"100%\" style=\"position:absolute\" frameBorder=\"0\" class=\"giphy-embed\" allowFullScreen></iframe></div>",
  "Email Not Found": "<div style=\"width:100%;height:0;padding-bottom:74%;position:relative;\"><iframe src=\"https://giphy.com/embed/ZOFFvvABgG7dK\" width=\"100%\" height=\"100%\" style=\"position:absolute\" frameBorder=\"0\" class=\"giphy-embed\" allowFullScreen></iframe></div>",
  "General Error": "<div style=\"width:100%;height:0;padding-bottom:77%;position:relative;\"><iframe src=\"https://giphy.com/embed/L3QT1L99qG7M6gFRpM\" width=\"100%\" height=\"100%\" style=\"position:absolute\" frameBorder=\"0\" class=\"giphy-embed\" allowFullScreen></iframe></div>",
  "Successful Sign-In": "<div style=\"width:100%;height:0;padding-bottom:56%;position:relative;\"><iframe src=\"https://giphy.com/embed/hrpjWzFIbOjkxltbBG\" width=\"100%\" height=\"100%\" style=\"position:absolute\" frameBorder=\"0\" class=\"giphy-embed\" allowFullScreen></iframe></div>" // Using default for now, user can provide a specific one
};

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [currentMeme, setCurrentMeme] = useState<string>(memeMap["Default"]); //memes based on the error messages 
  const [isLoading, setIsLoading] = useState(true); // New loading state

  // Simulate loading for the meme (as iframe load detection is complex with dangerouslySetInnerHTML)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Adjust delay as needed

    return () => clearTimeout(timer);
  }, []);

  const handleSignUp = async () => {
    try {
      setError(null);
      setMessage(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      setMessage("Sign up successful. Check our spam folder (since we can't afford a domain name right now) and verify your account. You can now sign in after verification.");
      setCurrentMeme(memeMap["Successful Sign-Up"]);
      setEmail(''); // Clear email field
      setPassword(''); // Clear password field
    } catch (err: any) {
      console.error("Error during sign up:", err);
      setError(err.message);
      setCurrentMeme(memeMap["General Error"]); // Set general error meme on sign-up failure
    }
  };

  const handleSignIn = async () => {
    try {
      setError(null); // Clear previous errors
      setMessage(null); // Clear previous messages
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Sign in successful!");
      setCurrentMeme(memeMap["Successful Sign-In"]); // Set successful sign-in meme
      onLoginSuccess();
    } catch (err: any) {
      console.error("Error during sign in:", err);
      let errorMessage = "An unknown error occurred during sign in.";
      switch (err.code) {
        case 'auth/user-not-found':
          errorMessage = "No user found with this email. Please sign up or check your email.";
          setCurrentMeme(memeMap["Email Not Found"]); // Specific meme for user not found
          break;
        case 'auth/wrong-password':
          errorMessage = "Incorrect password. Please try again.";
          setCurrentMeme(memeMap["Invalid Credentials"]); // Specific meme for wrong password
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email address format.";
          setCurrentMeme(memeMap["General Error"]); // General error meme for invalid email format
          break;
        case 'auth/invalid-credential':
          errorMessage = "Invalid email or password. Please check your credentials.";
          setCurrentMeme(memeMap["Invalid Credentials"]); // Specific meme for invalid credentials
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many sign-in attempts. Please try again later.";
          setCurrentMeme(memeMap["General Error"]); // General error meme for too many requests
          break;
        
        default:
          errorMessage = err.message;
          setCurrentMeme(memeMap["General Error"]); // Fallback to general error meme
      }
      setError(errorMessage);
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-center min-h-screen bg-background p-4 md:p-8 space-y-8 md:space-y-0 md:space-x-16"> 
      {isLoading ? ( // Conditional rendering for loading state
        <div className="flex items-center justify-center w-full h-full min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
          <span className="sr-only">Loading...</span> 
        </div>
      ) : (
        <> {/* Use a fragment to return multiple elements */}
          {/* Left Column: Auth Form */}
          <div className="w-full md:w-2/5 p-5 md:py-20 md:px-10 bg-card rounded-lg shadow-lg"> 
            <h1 className="text-4xl font-bold text-foreground mb-8 text-center">King of Audio</h1>
            {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
            {message && <p className="text-green-500 mb-4 text-center">{message}</p>}
            <div className="space-y-4"> {/* Reverted space-y to 4 */}
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-border rounded-md bg-input text-foreground"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-border rounded-md bg-input text-foreground"
              />
              <Button
                onClick={handleSignIn}
                className="w-full bg-gradient-primary hover:bg-primary/80 transition-colors text-lg px-8 py-3 mb-2 hover:shadow-glow-primary-on-hover"
              >
                Sign In
              </Button>
              <Button
                onClick={handleSignUp}
                variant="outline"
                className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors text-lg px-8 py-3"
              >
                Sign Up
              </Button>
            </div>
          </div>

          {/* Right Column: Meme Display */}
          <div className="w-full md:w-3/5 max-w-md flex items-center justify-center"> {/* Changed md:w-1/2 to md:w-3/5 */}
            <div className="w-full h-auto pointer-events-none overflow-hidden">
              <div dangerouslySetInnerHTML={{ __html: currentMeme }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Auth;
