import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth"; // Import the Auth component
import { useState, useEffect } from "react"; // Import useState and useEffect
import { auth } from './firebase'; // Import auth from your firebase.ts
import { onAuthStateChanged } from 'firebase/auth';

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, but check if email is verified
        if (user.emailVerified) {
          setIsAuthenticated(true);
        } else {
          // User is signed in but email not verified
          setIsAuthenticated(false);
          // Optionally, sign out the user or redirect to a specific verification page
          // For now, we'll just keep them on the Auth page
        }
      } else {
        // User is signed out
        setIsAuthenticated(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading authentication...</div>; // Or a loading spinner
  }

  const handleLoginSuccess = () => {
    // This function is called from Auth.tsx.
    // If a user signs in, we need to re-check their auth state to see if they are verified.
    // Firebase's onAuthStateChanged listener will handle this.
    // For sign-up, onLoginSuccess is no longer called directly.
    // For sign-in, onAuthStateChanged will trigger and check verification.
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {isAuthenticated ? (
              <Route path="/" element={<Index />} />
            ) : (
              <Route path="/" element={<Auth onLoginSuccess={handleLoginSuccess} />} />
            )}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
