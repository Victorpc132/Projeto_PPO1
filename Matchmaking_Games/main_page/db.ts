import { Database } from "bun:sqlite"

const databasePath = process.env.DUOPLAY_DB_PATH ?? "banco.sqlite"
const db = new Database(databasePath, { create: true })

db.exec("PRAGMA foreign_keys = ON")
db.exec("PRAGMA journal_mode = WAL")

db.exec(`
  CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS profile (
    user_id INTEGER PRIMARY KEY,
    nickname TEXT NOT NULL DEFAULT '',
    game TEXT NOT NULL DEFAULT 'VALORANT',
    platform TEXT NOT NULL DEFAULT 'PC',
    level TEXT NOT NULL DEFAULT '',
    style TEXT NOT NULL DEFAULT 'Casual',
    availability TEXT NOT NULL DEFAULT 'Noites',
    favorite TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT '',
    mode TEXT NOT NULL DEFAULT '',
    secondary_role TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS preferences (
    user_id INTEGER PRIMARY KEY,
    game TEXT NOT NULL DEFAULT '',
    platform TEXT NOT NULL DEFAULT '',
    time TEXT NOT NULL DEFAULT '',
    favorite TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT '',
    mode TEXT NOT NULL DEFAULT '',
    secondary_role TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS friend_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'declined')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sender_id, receiver_id),
    CHECK(sender_id != receiver_id),
    FOREIGN KEY (sender_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES user(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, friend_id),
    CHECK(user_id != friend_id),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES user(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    user_id INTEGER PRIMARY KEY,
    profile_public INTEGER NOT NULL DEFAULT 1 CHECK(profile_public IN (0, 1)),
    show_availability INTEGER NOT NULL DEFAULT 1 CHECK(show_availability IN (0, 1)),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_profile_game ON profile(game);
  CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id, status);
  CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
`)

const ensureColumn = (table: string, column: string, definition: string) => {
  const columns = db.query(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>
  if (!columns.some((item) => item.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

// Migra bancos existentes sem apagar perfis, relações ou credenciais.
ensureColumn("profile", "mode", "TEXT NOT NULL DEFAULT ''")
ensureColumn("profile", "secondary_role", "TEXT NOT NULL DEFAULT ''")
ensureColumn("preferences", "mode", "TEXT NOT NULL DEFAULT ''")
ensureColumn("preferences", "secondary_role", "TEXT NOT NULL DEFAULT ''")
db.exec("CREATE INDEX IF NOT EXISTS idx_profile_game_mode_platform ON profile(game, mode, platform)")

db.exec(`
  UPDATE profile SET game = 'VALORANT' WHERE LOWER(TRIM(game)) = 'valorant';
  UPDATE preferences SET game = 'VALORANT' WHERE LOWER(TRIM(game)) = 'valorant';
  UPDATE preferences SET game = '' WHERE game IS NULL;
  INSERT OR IGNORE INTO friends (user_id, friend_id)
    SELECT sender_id, receiver_id FROM friend_requests WHERE status = 'accepted';
  INSERT OR IGNORE INTO friends (user_id, friend_id)
    SELECT receiver_id, sender_id FROM friend_requests WHERE status = 'accepted';
`)

export { db }
export default db
