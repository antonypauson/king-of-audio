# King of Audio - Database Schema

## Tables Overview

### `users`
Stores user profiles and their current audio battle status.

| Column                | Type          | Constraints         | Description                                          |
| --------------------- | ------------- | ------------------- | ---------------------------------------------------- |
| `id`                  | `text`        | PRIMARY KEY         | Firebase UID                                         |
| `email`               | `text`        | UNIQUE              | User's email address                                 |
| `username`            | `text`        | UNIQUE, NOT NULL    | Display name                                         |
| `avatar_url`          | `text`        |                     | Profile picture URL                                  |
| `total_time_held`     | `integer`     | NOT NULL, DEFAULT 0 | Cumulative reign time in seconds                     |
| `current_clip_url`    | `text`        |                     | URL to user’s latest audio clip (in Supabase bucket) |
| `current_reign_start` | `timestamptz` |                     | When current reign began (if reigning)               |
| `created_at`          | `timestamptz` | DEFAULT now()       | Account creation timestamp                           |


### `activity_events`
Real-time activity feed for battle history.

| Column           | Type          | Constraints                                           | Description                           |
| ---------------- | ------------- | ----------------------------------------------------- | ------------------------------------- |
| `id`             | `bigserial`   | PRIMARY KEY                                           | Auto-incrementing event ID            |
| `type`           | `text`        | NOT NULL, CHECK (`'join'`, `'upload'`, `'dethroned'`) | Event type                            |
| `user_id`        | `text`        | FK → users(id)                                        | Primary actor                         |
| `target_user_id` | `text`        | FK → users(id)                                        | Secondary actor (for dethroned, etc.) |
| `message`        | `text`        |                                                       | Optional event description            |
| `created_at`     | `timestamptz` | DEFAULT now(), INDEXED DESC                           | Event timestamp                       |


### `game_state`
Single-row table tracking current game status.

| Column             | Type          | Constraints               | Description                         |
| ------------------ | ------------- | ------------------------- | ----------------------------------- |
| `id`               | `boolean`     | PRIMARY KEY, DEFAULT true | Always `true` (enforces single row) |
| `reigning_user_id` | `text`        | FK → users(id)            | Current audio king                  |
| `reign_start`      | `timestamptz` |                           | When current reign began            |


## Key Features

- **Firebase Integration**: Uses Firebase UID as primary key

- **Lightweight**: No clips table, since only latest audio per user is stored

- **Real-time Ready**: Activity events indexed by timestamp

- **Single Game State**: Enforced single-row game_state table

- **Cascade Deletes**: User deletion removes associated data (activity events, reign state)

## Relationships

```
users (1) ←→ (many) activity_events (as user_id)
users (1) ←→ (many) activity_events (as target_user_id)
users (1) ←→ (0..1) game_state (as reigning_user_id)
```
