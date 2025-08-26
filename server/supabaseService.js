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
        return null;
    }
    return data[0]; // Return the newly inserted user
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
    const { data: gameStateUpdateData, error: gameStateUpdateError } = await supabase
        .from('game_state')
        .update({
            reigning_user_id: userId,
            reign_start: new Date(newReignStart).toISOString(),
        })
        .eq('id', true) // Assuming 'id' is a boolean and always true for the single row
        .select();

    if (gameStateUpdateError) {
        console.error('Error updating game state in Supabase:', gameStateUpdateError);
        // Consider rolling back user update here if this were a true transaction
        return null;
    }

    return { user: userUpdateData[0], gameState: gameStateUpdateData[0] };
}
