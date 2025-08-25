// server/data.js

// ---------------------------
// Users (latest clip + cumulative time)
// ---------------------------
export let mockUsers = [
  {
    id: "user_joe_dane",
    username: "joe_dane",
    avatarUrl: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=joe_dane",
    totalTimeHeld: 12500, // cumulative time in seconds
    currentClipUrl: "https://www.example.com/audio_joe.mp3",
    currentReignStart: null, //not reigning player currently
  },
  {
    id: "user_ihatebignannies",
    username: "ihatebignannies",
    avatarUrl:
      "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=ihatebignannies",
    totalTimeHeld: 9800,
    currentClipUrl: "https://www.example.com/audio_ihatebignannies.mp3",
    currentReignStart: Date.now() - 8000, //currently reigning player
  },
  {
    id: "user_lina_rocks",
    username: "lina_rocks",
    avatarUrl:
      "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=lina_rocks",
    totalTimeHeld: 7200,
    currentClipUrl: "https://www.example.com/audio_lina.mp3",
    currentReignStart: null, 
  },
  {
    id: "user_mike_the_mic",
    username: "mike_the_mic",
    avatarUrl:
      "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=mike_the_mic",
    totalTimeHeld: 4500,
    currentClipUrl: "https://www.example.com/audio_mike.mp3",
    currentReignStart: null,
  },
  {
    id: "user_your_mom",
    username: "your_mom",
    avatarUrl:
      "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=your_mom",
    totalTimeHeld: 4500,
    currentClipUrl: "https://www.example.com/audio_mike.mp3",
    currentReignStart: null,
  },
];

// ---------------------------
// Current Game State
// ---------------------------
export const mockCurrentGameState = {
  currentUserId: "user_ihatebignannies",
  currentClipUrl: "https://www.example.com/audio_ihatebignannies.mp3",
  reignStart: Date.now() - 8000,
};

// ---------------------------
// Activity Feed (initial) - This will be mutated by API calls
// ---------------------------
export let mockActivityFeed = [
  {
    id: "event_001",
    type: "takeover",
    userId: "user_joe_dane",
    targetUserId: "user_ihatebignannies",
    timestamp: Date.now() - 12000,
  },
  {
    id: "event_002",
    type: "upload",
    userId: "user_ihatebignannies",
    timestamp: Date.now() - 8000,
  },
  {
    id: "event_003",
    type: "failed",
    userId: "user_lina_rocks",
    targetUserId: "user_ihatebignannies",
    timestamp: Date.now() - 5000,
  },
  {
    id: "event_004",
    type: "dethroned",
    userId: "user_mike_the_mic",
    targetUserId: "user_joe_dane",
    timestamp: Date.now() - 2000,
  },
];

// ---------------------------
// current user? - This will be determined by authentication later
// ---------------------------
export const mockCurrentUser = {
  id: "user_joe_dane", // Changed to joe_dane for consistency with initial reigning user
};

// Helper function to update a user's clip URL and reign start, and update game state
// when current user uploads an audio, we update its currentClip and currentreignStart
// since its a reigning player now, we all update the mockCurrentGameState, whic his storing reigning player
export function updateMockUserClipAndReign(userId, newClipUrl, newReignStart) {
  mockUsers = mockUsers.map(user => {
    if (user.id === userId) {
      return { ...user, currentClipUrl: newClipUrl, currentReignStart: newReignStart };
    }
    return user;
  });
  
  // Update mockCurrentGameState
  mockCurrentGameState.currentUserId = userId;
  mockCurrentGameState.currentClipUrl = newClipUrl;
  mockCurrentGameState.reignStart = newReignStart;

  console.log("mockUsers updated:", mockUsers); // Log for verification
  console.log("mockCurrentGameState updated:", mockCurrentGameState); // Log for verification
}

// currently reigning user
// to find out who is current reigning player
// the player who have a currentReignStart is the one who is reigning, others have null there
export function findReigningUser() {
  return mockUsers.find(user => user.currentReignStart !== null);
}

// dethrone a user and update their totalTimeHeld
//when a player gets dethroned, we update their totalTimeHeld
//we do this by adding to the current totalTimeHeld, the difference between now (time of dethroning) and reignStart 
export function dethroneUser(userId) {
  mockUsers = mockUsers.map(user => {
    if (user.id === userId && user.currentReignStart !== null) {
      const reignDuration = Date.now() - user.currentReignStart;
      return { 
        ...user,
        totalTimeHeld: user.totalTimeHeld + Math.floor(reignDuration / 1000), // Add duration in seconds
        currentReignStart: null 
      };
    }
    return user;
  });
  console.log(`User ${userId} dethroned. mockUsers updated:`, mockUsers);
}

// Helper function to add an activity event (mutates mockActivityFeed)
//current events: 'dethrone' and 'upload'
export function addActivityEvent(newEvent) {
  mockActivityFeed = [...mockActivityFeed, newEvent];
  console.log("addActivityEvent: new feed created:", mockActivityFeed);
}

// Helper function to increment totalTimeHeld for the reigning user
// we'll call this inside setTimeout to increment every second
export function incrementReigningUserTotalTime() {
  const reigningUser = findReigningUser();
  if (reigningUser && reigningUser.currentReignStart !== null) {
    mockUsers = mockUsers.map(user => {
      if (user.id === reigningUser.id) {
        return { ...user, totalTimeHeld: user.totalTimeHeld + 1 };
      }
      return user;
    });
    console.log(`User ${reigningUser.username}'s totalTimeHeld incremented.`);
  }
}

// Helper to format activity feed text (can be moved to frontend or kept here for consistency)
export function formatActivity(event, usersMap) {
  const secondsAgo = Math.floor((Date.now() - event.timestamp) / 1000);
  const user = usersMap[event.userId];
  const targetUser = event.targetUserId ? usersMap[event.targetUserId] : null;

  let timeAgoString;
  if (secondsAgo < 60) {
    timeAgoString = `${secondsAgo}s ago`;
  } else if (secondsAgo < 3600) { // Less than 1 hour
    const minutes = Math.floor(secondsAgo / 60);
    timeAgoString = `${minutes}m ago`;
  } else if (secondsAgo < 86400) { // Less than 1 day
    const hours = Math.floor(secondsAgo / 3600);
    timeAgoString = `${hours}h ago`;
  } else {
    const days = Math.floor(secondsAgo / 86400);
    timeAgoString = `${days}d ago`;
  }

  switch (event.type) {
    case "takeover":
      return `${user.username} took over ${targetUser.username} (${timeAgoString})`;
    case "dethroned":
      return `${user.username} dethroned ${targetUser.username} (${timeAgoString})`;
    case "upload":
      return `${user.username} uploaded a new audio (${timeAgoString})`;
    case "failed":
      return `${user.username} tried to take over ${targetUser.username} but failed (${timeAgoString})`;
    default:
      return `${user.username} did something (${timeAgoString})`;
  }
}

// Helper function to check if a username is unique (case-insensitive)
// we are asking for username after signing in only, an initial front end check is there in client side
export function isUsernameUnique(usernameToCheck) {
  const lowerCaseUsernameToCheck = usernameToCheck.toLowerCase();
  return !mockUsers.some(user => user.username.toLowerCase() === lowerCaseUsernameToCheck);
}

// Example usersMap for easy lookup (can be generated dynamically or kept here)
export const usersMap = mockUsers.reduce((acc, user) => {
  acc[user.id] = user;
  return acc;
}, {});