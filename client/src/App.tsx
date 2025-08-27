import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { useState, useEffect, Suspense } from "react"; // Added Suspense
const Index = React.lazy(() => import("./pages/Index")); // Lazy loaded
const NotFound = React.lazy(() => import("./pages/NotFound")); // Lazy loaded
const Auth = React.lazy(() => import("./pages/Auth")); // Lazy loaded
import { auth } from './firebase'; // Import auth from your firebase.ts
import { onAuthStateChanged } from 'firebase/auth';

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authCheckComplete, setAuthCheckComplete] = useState(false); // New state for auth check completion
  const [dataLoaded, setDataLoaded] = useState(false); // New state to track data loading in Index.tsx

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.emailVerified) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
      setAuthCheckComplete(true); // Set to true after auth check is complete
    });
    return () => unsubscribe();
  }, []);

  const handleDataLoaded = () => {
    setDataLoaded(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {authCheckComplete ? (
            <Suspense fallback={
              <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
                <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-primary"></div>
                <span className="sr-only">Loading content...</span>
              </div>
            }>
              <Routes>
                {isAuthenticated ? (
                  <Route path="/" element={<Index onDataLoaded={handleDataLoaded} />} />
                ) : (
                  <Route path="/" element={<Auth onLoginSuccess={handleLoginSuccess} />} />
                )}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          ) : (
            // Optional: A simple loading spinner or null while auth check is in progress
            <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
              <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-primary"></div>
              <span className="sr-only">Loading authentication...</span>
            </div>
          )}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
