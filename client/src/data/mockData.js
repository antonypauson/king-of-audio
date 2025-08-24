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
    currentReignStart: null,
  },
  {
    id: "user_ihatebignannies",
    username: "ihatebignannies",
    avatarUrl:
      "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=ihatebignannies",
    totalTimeHeld: 9800,
    currentClipUrl: "https://www.example.com/audio_ihatebignannies.mp3",
    currentReignStart: Date.now() - 8000,
  },
  {
    id: "user_lina_rocks",
    username: "lina_rocks",
    avatarUrl:
      "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=lina_rocks",
    totalTimeHeld: 7200,
    currentClipUrl: "https://www.example.com/audio_lina.mp3",
    currentReignStart: null, // currently not reigning
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

// Helper function to update a user's clip URL and reign start, and update game state
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
export function findReigningUser() {
  return mockUsers.find(user => user.currentReignStart !== null);
}

// dethrone a user and update their totalTimeHeld
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

// ---------------------------
// Current Game State
// ---------------------------
export const mockCurrentGameState = {
  currentUserId: "user_ihatebignannies",
  currentClipUrl: "https://www.example.com/audio_ihatebignannies.mp3",
  reignStart: Date.now() - 8000,
};

// ---------------------------
// Activity Feedv (initial, cause we will be mutating it but not directly)
// ---------------------------
export const initialMockActivityFeed = [ 
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

// Helper function to add an activity event (returns new array, doesn't mutate)
export function addMockActivityEvent(currentFeed, newEvent) {
  const updatedFeed = [...currentFeed, newEvent];
  console.log("addMockActivityEvent: new feed created:", updatedFeed);
  return updatedFeed;
}

// add takeover and dethroned events
export function addTakeoverAndDethronedEvents(currentFeed, dethronedUserId, newReigningUserId) {
  const now = Date.now();
  const takeoverEvent = {
    id: `event_${now}_takeover`,
    type: "takeover",
    userId: newReigningUserId,
    targetUserId: dethronedUserId,
    timestamp: now,
  };
  const dethronedEvent = {
    id: `event_${now}_dethroned`,
    type: "dethroned",
    userId: newReigningUserId, // The new reigning user is the one who dethroned
    targetUserId: dethronedUserId,
    timestamp: now,
  };

  let updatedFeed = [...currentFeed, takeoverEvent];
  updatedFeed = [...updatedFeed, dethronedEvent];
  console.log("addTakeoverAndDethronedEvents: new feed created:", updatedFeed);
  return updatedFeed;
}

// ---------------------------
// current user?
// ---------------------------
export const mockCurrentUser = {
  id: "user_lina_rocks"
};


// ---------------------------
// Helper to format activity feed text
// ---------------------------
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

// ---------------------------
// Example usersMap for easy lookup
// ---------------------------
export const usersMap = mockUsers.reduce((acc, user) => {
  acc[user.id] = user;
  return acc;
}, {});