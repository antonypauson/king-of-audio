import React, { useState } from 'react';
import { User, updateProfile } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface UsernameModalProps {
  user: User;
  onUsernameSet: () => void;
}

const UsernameModal: React.FC<UsernameModalProps> = ({ user, onUsernameSet }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSaveUsername = async () => {
    setError(null); // Clear previous errors
    const trimmedUsername = username.trim();

    // Rule 1: Minimum 3 characters, Maximum 15 characters
    if (trimmedUsername.length < 3 || trimmedUsername.length > 15) {
      setError("Username must be between 3 and 15 characters long.");
      return;
    }

    // Rule 2: Allowed characters: a-z, A-Z, 0-9, _, .
    // Rule 3: No spaces or other special symbols
    const allowedCharsRegex = /^[a-zA-Z0-9_.]+$/;
    if (!allowedCharsRegex.test(trimmedUsername)) {
      setError("Username can only contain letters, numbers, underscores, and dots");
      return;
    }

    // Rule 4: Cannot start or end with _ or .
    if (trimmedUsername.startsWith('_') || trimmedUsername.startsWith('.') ||
        trimmedUsername.endsWith('_') || trimmedUsername.endsWith('.')) {
      setError("Username cannot start or end with an underscore or a dot.");
      return;
    }

    // Rule 5: No consecutive underscores or dots
    if (trimmedUsername.includes('__') || trimmedUsername.includes('..')) {
      setError("Username cannot contain consecutive underscores or dots.");
      return;
    }

    setLoading(true);
    try {
      // Check uniqueness with backend
      const response = await fetch(`http://localhost:5000/api/check-username-uniqueness?username=${trimmedUsername}`);
      const data = await response.json();

      if (!data.isUnique) {
        setError("This username is already taken. Please choose a different one.");
        setLoading(false);
        return;
      }

      // Store as lowercase internally, but display as typed (Firebase displayName handles this)
      await updateProfile(user, {
        displayName: trimmedUsername, // Firebase stores it as is, we just use it as is
      });
      onUsernameSet(); // Notify parent component that username is set
    } catch (err: any) {
      console.error("Error setting username:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-card p-8 rounded-lg shadow-lg text-center max-w-sm w-full">
        <h2 className="text-2xl font-bold text-foreground mb-4">Set Your Username</h2>
        {/* <p className="text-muted-foreground mb-6"></p> */}
        
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <Input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-3 border border-border rounded-md bg-input text-foreground mb-4"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSaveUsername();
            }
          }}
        />
        <Button
          onClick={handleSaveUsername}
          disabled={loading}
          className="w-full bg-gradient-primary hover:text-white transition-colors text-lg px-8 py-3"
        >
          {loading ? "Saving..." : "Save Username"}
        </Button>
      </div>
    </div>
  );
};

export default UsernameModal;
