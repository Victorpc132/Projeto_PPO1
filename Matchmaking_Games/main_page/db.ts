import { Database } from "bun:sqlite"

const db = new Database("banco.sqlite")

db.exec(`
    CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profile (
        user_id INTEGER PRIMARY KEY,
        nickname TEXT,
        game TEXT,
        platform TEXT,
        level TEXT,
        style TEXT,
        availability TEXT,
        favorite TEXT,
        role TEXT,
        FOREIGN KEY (user_id) REFERENCES user(id)
    );

    CREATE TABLE IF NOT EXISTS preferences (
        user_id INTEGER PRIMARY KEY,
        game TEXT,
        platform TEXT,
        time TEXT,
        favorite TEXT,
        role TEXT,
        FOREIGN KEY (user_id) REFERENCES user(id)
    );

    CREATE TABLE IF NOT EXISTS friend_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(sender_id, receiver_id),
        FOREIGN KEY (sender_id) REFERENCES user(id),
        FOREIGN KEY (receiver_id) REFERENCES user(id)
    );

    CREATE TABLE IF NOT EXISTS friends (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        friend_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, friend_id),
        FOREIGN KEY (user_id) REFERENCES user(id),
        FOREIGN KEY (friend_id) REFERENCES user(id)
    );
`)

export { db }
export default db