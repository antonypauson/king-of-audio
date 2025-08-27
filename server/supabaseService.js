// doing everything using supabase instead of mockdata stored in backend
import { supabase } from './index.js'; // Import the Supabase client from index.js


export async function getUsersFromSupabase() {
    const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar_url, total_time_held, current_clip_url, current_reign_start');

    if (error) {
        console.error('Error fetching users from Supabase:', error);
        return [];
    }
    return data.map(user => ({
        id: user.id,
        username: user.username,
        avatarUrl: user.avatar_url,
        totalTimeHeld: user.total_time_held,
        currentClipUrl: user.current_clip_url,
        currentReignStart: user.current_reign_start ? new Date(user.current_reign_start).getTime() : null,
    }));
}

export async function isUsernameUniqueInSupabase(usernameToCheck) {
    const { data, error } = await supabase
        .from('users')
        .select('username')
        .like('username', usernameToCheck);

    if (error) {
        console.error('Error checking username uniqueness in Supabase:', error);
        return false; // Assume not unique on error for safety
    }
    return data.length === 0;
}

export async function addNewUserToSupabase(id, username, avatarUrl) {
    // First, check if the user already exists
    const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id, username, avatar_url, total_time_held, current_clip_url, current_reign_start')
        .eq('id', id)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error checking for existing user in Supabase:', fetchError);
        return { user: null, created: false }; // Return null user and false for created on error
    }

    if (existingUser) {
        console.log('User already exists, returning existing user data.');
        return {
            user: {
                id: existingUser.id,
                username: existingUser.username,
                avatarUrl: existingUser.avatar_url,
                totalTimeHeld: existingUser.total_time_held,
                currentClipUrl: existingUser.current_clip_url,
                currentReignStart: existingUser.current_reign_start ? new Date(existingUser.current_reign_start).getTime() : null,
            },
            created: false // User already existed
        };
    }

    // If user does not exist, proceed with insertion
    const { data, error } = await supabase
        .from('users')
        .insert([
            {
                id: id,
                username: username,
                avatar_url: avatarUrl,
                total_time_held: 0,
                current_clip_url: null,
                current_reign_start: null,
            },
        ])
        .select(); // Select the inserted data to return it

    if (error) {
        console.error('Error adding new user to Supabase:', error);
        return { user: null, created: false }; // Return null user and false for created on error
    }
    return { user: data[0], created: true }; // Return the newly inserted user and true for created
}

export async function updateUserClipAndReignInSupabase(userId, newClipUrl, newReignStart) {
    // Start a transaction-like operation (Supabase client doesn't have explicit transactions for multiple calls)
    // For true atomicity across multiple tables, consider a PostgreSQL function (RPC).
    // Here, we'll update users and game_state sequentially.

    // 1. Update the user's current_clip_url and current_reign_start
    const { data: userUpdateData, error: userUpdateError } = await supabase
        .from('users')
        .update({
            current_clip_url: newClipUrl,
            current_reign_start: new Date(newReignStart).toISOString(), // Convert timestamp to ISO string
        })
        .eq('id', userId)
        .select();

    if (userUpdateError) {
        console.error('Error updating user clip and reign in Supabase:', userUpdateError);
        return null;
    }

    // 2. Update the game_state table to reflect the new reigning user
    console.log('updateUserClipAndReignInSupabase: userId, newClipUrl, newReignStart', userId, newClipUrl, newReignStart);
    console.log('updateUserClipAndReignInSupabase: userUpdateError, userUpdateData', userUpdateError, userUpdateData);
    const { data: gameStateUpdateData, error: gameStateUpdateError } = await supabase
        .from('game_state')
        .upsert({
            id: true, // Explicitly set the boolean ID
            reigning_user_id: userId,
            reign_start: new Date(newReignStart).toISOString(),
        }, { onConflict: 'id' })
        .select();
    console.log('updateUserClipAndReignInSupabase: gameStateUpdateError, gameStateUpdateData', gameStateUpdateError, gameStateUpdateData);

    if (gameStateUpdateError) {
        console.error('Error updating game state in Supabase:', gameStateUpdateError);
        // Consider rolling back user update here if this were a true transaction
        return null;
    }

    return { user: userUpdateData[0], gameState: gameStateUpdateData[0] };
}

export async function dethroneUserInSupabase(userId) {
    // 1. Get the user's current reign start time
    const { data: userData, error: userFetchError } = await supabase
        .from('users')
        .select('total_time_held, current_reign_start')
        .eq('id', userId)
        .single();

    if (userFetchError || !userData) {
        console.error('Error fetching user for dethrone:', userFetchError);
        return null;
    }

    const { total_time_held, current_reign_start } = userData;

    if (!current_reign_start) {
        console.log('User is not currently reigning, no dethrone action needed.');
        return null;
    }

    const reignDuration = Date.now() - new Date(current_reign_start).getTime();
    const newTotalTimeHeld = total_time_held + Math.floor(reignDuration / 1000);

    // 2. Update the user's total_time_held and set current_reign_start to null
    const { data: userUpdateData, error: userUpdateError } = await supabase
        .from('users')
        .update({
            total_time_held: newTotalTimeHeld,
            current_reign_start: null,
        })
        .eq('id', userId)
        .select();

    if (userUpdateError) {
        console.error('Error updating user on dethrone in Supabase:', userUpdateError);
        return null;
    }

    // 3. Clear the reigning_user_id and reign_start in the game_state table
    const { data: gameStateUpdateData, error: gameStateUpdateError } = await supabase
        .from('game_state')
        .upsert({
            id: true, // Explicitly set the boolean ID
            reigning_user_id: null,
            reign_start: null,
        }, { onConflict: 'id' })
        .select();

    if (gameStateUpdateError) {
        console.error('Error clearing game state on dethrone in Supabase:', gameStateUpdateError);
        // This is a tricky situation, as the user update succeeded but game state failed.
        // For a real app, you'd want more robust error handling/rollback or a DB function.
        return null;
    }

    return { user: userUpdateData[0], gameState: gameStateUpdateData[0] };
}

export async function addActivityEventToSupabase(event) {
    const { data, error } = await supabase
        .from('activity_events')
        .insert([
            {
                type: event.type,
                user_id: event.userId,
                target_user_id: event.targetUserId || null, // Optional
                message: event.message || null, // Optional
                created_at: new Date(event.timestamp).toISOString(),
            },
        ])
        .select();

    if (error) {
        console.error('Error adding activity event to Supabase:', error);
        return null;
    }
    return data[0];
}

export async function getActivityFeedFromSupabase() {
    const { data, error } = await supabase
        .from('activity_events')
        .select('*, users!activity_events_user_id_fkey(username), target_user:users!activity_events_target_user_id_fkey(username)')
        .order('created_at', { ascending: false })
        .limit(50); // Limit to last 50 events for the feed

    if (error) {
        console.error('Error fetching activity feed from Supabase:', error);
        return [];
    }

    // Map the data to a more usable format, similar to mockActivityFeed
    return data.map(event => ({
        id: event.id,
        type: event.type,
        userId: event.user_id,
        username: event.users.username, // Access username from the joined 'users' table
        targetUserId: event.target_user_id,
        targetUsername: event.target_user ? event.target_user.username : null, // Access target username
        timestamp: new Date(event.created_at).getTime(),
        message: event.message,
    }));
}

export async function getGameStateFromSupabase() {
    const { data, error } = await supabase
        .from('game_state')
        .select('reigning_user_id, reign_start')
        .eq('id', true) // Assuming 'id' is a boolean and always true for the single row
        .single();

    if (error) {
        console.error('Error fetching game state from Supabase:', error);
        return null;
    }

    if (!data) {
        // If no game state exists, return a default empty state
        return {
            currentUserId: null,
            currentClipUrl: null, // This would need to be fetched from the user table if reigning_user_id exists
            reignStart: null,
        };
    }

    let currentClipUrl = null;
    if (data.reigning_user_id) {
        // Fetch the currentClipUrl for the reigning user
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('current_clip_url')
            .eq('id', data.reigning_user_id)
            .single();

        if (userError) {
            console.error('Error fetching reigning user clip URL:', userError);
        } else if (userData) {
            currentClipUrl = userData.current_clip_url;
        }
    }

    return {
        currentUserId: data.reigning_user_id,
        currentClipUrl: currentClipUrl,
        reignStart: data.reign_start ? new Date(data.reign_start).getTime() : null,
    };
}

export async function incrementReigningUserTotalTimeInSupabase(userId) {
    // This function is tricky to implement purely with client-side Supabase calls
    // because it requires reading the current value, incrementing, and writing back,
    // which can lead to race conditions if multiple instances try to do it simultaneously.
    // A better approach for production would be a Supabase Function (PostgreSQL function)
    // that handles the increment atomically on the database side.

    // For now, we'll implement a basic read-then-write, acknowledging the race condition risk.

    const { data: userData, error: userFetchError } = await supabase
        .from('users')
        .select('total_time_held')
        .eq('id', userId)
        .single();

    if (userFetchError || !userData) {
        console.error('Error fetching user for incrementing total time:', userFetchError);
        return null;
    }

    const newTotalTimeHeld = userData.total_time_held + 1;

    const { data, error } = await supabase
        .from('users')
        .update({ total_time_held: newTotalTimeHeld })
        .eq('id', userId)
        .select();

    if (error) {
        console.error('Error incrementing total_time_held in Supabase:', error);
        return null;
    }
    return data[0];
}

export async function findReigningUserInSupabase() {
    // 1. Get the reigning_user_id from the game_state table
    const { data: gameState, error: gameStateError } = await supabase
        .from('game_state')
        .select('reigning_user_id')
        .eq('id', true) // Assuming 'id' is a boolean and always true for the single row
        .single();

    if (gameStateError) {
        console.error('Error fetching game state for reigning user:', gameStateError);
        return null;
    }

    if (!gameState || !gameState.reigning_user_id) {
        return null; // No reigning user
    }

    // 2. Fetch the full user details for the reigning user
    const { data: reigningUser, error: userError } = await supabase
        .from('users')
        .select('id, username, avatar_url, total_time_held, current_clip_url, current_reign_start')
        .eq('id', gameState.reigning_user_id)
        .single();

    if (userError) {
        console.error('Error fetching reigning user details:', userError);
        return null;
    }

    // Map to the same format as mockUsers
    return {
        id: reigningUser.id,
        username: reigningUser.username,
        avatarUrl: reigningUser.avatar_url,
        totalTimeHeld: reigningUser.total_time_held,
        currentClipUrl: reigningUser.current_clip_url,
        currentReignStart: reigningUser.current_reign_start ? new Date(reigningUser.current_reign_start).getTime() : null,
    };
}

export async function uploadAudioToSupabase(audioBuffer, filename, contentType) {
    try {
        const { data, error } = await supabase.storage
            .from('clips')
            .upload(filename, audioBuffer, {
                contentType: contentType,
                upsert: true, // Overwrite if file exists
            });

        if (error) {
            throw error;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from('clips')
            .getPublicUrl(filename);

        return publicUrlData.publicUrl;

    } catch (error) {
        console.error('Error uploading audio to Supabase:', error);
        throw error;
    }
}