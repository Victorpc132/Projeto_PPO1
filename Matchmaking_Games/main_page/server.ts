import { createHash, randomBytes } from "node:crypto"
import cadastro from "../cadastro.html"
import login from "../login.html"
import main from "./main.html"
import { db } from "./db"
import { GAME_CATALOG, findGame } from "./gameCatalog"
import { calculateCompatibility } from "./matchmaking"

const requestedPort = Number(process.env.PORT)
const port = Number.isFinite(requestedPort) ? requestedPort : 3000
const SESSION_COOKIE = "duoplay_session"
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000
const STYLE_OPTIONS = ["Competitivo", "Casual", "Estratégico", "Tático", "Cooperativo", "Agressivo", "Flexível"]
const AVAILABILITY_OPTIONS = ["Manhãs", "Tardes", "Noites", "Madrugadas", "Fins de semana", "Horários variados"]

const json = (data: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  })

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}

const cleanString = (value: unknown, max = 128) =>
  typeof value === "string" ? value.trim().slice(0, max) : ""

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex")
const getUserByEmail = db.prepare("SELECT id, username, email, password_hash FROM user WHERE email = ?")
const getUserById = db.prepare("SELECT id, username, email FROM user WHERE id = ?")
const getProfileByUserId = db.prepare("SELECT * FROM profile WHERE user_id = ?")
const getPreferencesByUserId = db.prepare("SELECT * FROM preferences WHERE user_id = ?")
const getSettingsByUserId = db.prepare("SELECT profile_public, show_availability FROM settings WHERE user_id = ?")
const saveFriendRelation = db.prepare("INSERT OR IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)")

const getCookie = (request: Request, name: string) => {
  const cookie = request.headers.get("cookie") || ""
  for (const part of cookie.split(";")) {
    const [key, ...value] = part.trim().split("=")
    if (key === name) return decodeURIComponent(value.join("="))
  }
  return ""
}

function publicOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
  const host = forwardedHost || request.headers.get("host")
  const protocol = forwardedProto || new URL(request.url).protocol.replace(":", "")
  return host ? `${protocol}://${host}` : new URL(request.url).origin
}

function cookieAttributes(request: Request, maxAge: number) {
  const isHttps = new URL(publicOrigin(request)).protocol === "https:"
  const sameSite = isHttps ? "None" : "Lax"
  return `Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${maxAge}${isHttps ? "; Secure" : ""}`
}

function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin")
  if (!origin || origin === "null") return true
  try {
    return new URL(origin).origin === new URL(publicOrigin(request)).origin
  } catch {
    return false
  }
}

async function authenticatedUser(request: Request) {
  const token = getCookie(request, SESSION_COOKIE)
  if (!token) return null
  const session = db.prepare(`
    SELECT u.id, u.username, u.email
    FROM sessions s JOIN user u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?
  `).get(hashToken(token), new Date().toISOString()) as { id: number; username: string; email: string } | undefined
  return session || null
}

function createSession(userId: number, request: Request) {
  const token = randomBytes(32).toString("base64url")
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(hashToken(token), userId, expiresAt)
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; ${cookieAttributes(request, Math.floor(SESSION_TTL_MS / 1000))}`
}

const clearSessionCookie = (request: Request) => `${SESSION_COOKIE}=; ${cookieAttributes(request, 0)}`

function publicGameCatalog() {
  return GAME_CATALOG.map(({ sourceUrls: _sourceUrls, ...game }) => game)
}

function validateProfile(payload: Record<string, unknown>) {
  const nickname = cleanString(payload.nickname, 32)
  const gameName = cleanString(payload.game, 80)
  const game = findGame(gameName)
  const mode = cleanString(payload.mode, 80)
  const platform = cleanString(payload.platform, 40)
  const level = cleanString(payload.level, 80)
  const style = cleanString(payload.style, 32)
  const availability = cleanString(payload.availability, 40)
  const role = cleanString(payload.role, 64)
  const secondaryRole = cleanString(payload.secondaryRole, 64)
  const favorite = cleanString(payload.favorite, 48)

  if (nickname.length < 2) return { error: "O nickname deve ter entre 2 e 32 caracteres." }
  if (!game) return { error: "Escolha um dos jogos disponíveis." }
  if (!game.platforms.includes(platform)) return { error: "Essa plataforma não está disponível para o jogo escolhido." }
  if (!game.modes.includes(mode)) return { error: "Escolha um modo válido para esse jogo." }
  if (!STYLE_OPTIONS.includes(style)) return { error: "Escolha um estilo de jogo válido." }
  if (!AVAILABILITY_OPTIONS.includes(availability)) return { error: "Escolha uma disponibilidade válida." }
  if (role && !game.roles.includes(role)) return { error: "A função selecionada não pertence às opções desse jogo." }
  if (secondaryRole && !(game.secondaryRoles || []).includes(secondaryRole)) return { error: "A função secundária não pertence às opções desse jogo." }
  if (favorite && !game.freeTextFavorite && !game.favorites.includes(favorite)) return { error: "A especialidade selecionada não pertence às opções desse jogo." }
  if (game.favoriteModes && favorite && !game.favoriteModes.includes(mode)) return { error: "A especialidade só se aplica ao modo indicado." }
  if (game.rankScope === "favorite" && mode !== game.ratingMode && !favorite) return { error: "Informe o mapa para registrar o rank competitivo do CS2." }

  const isRating = Boolean(game.ratingMode && mode === game.ratingMode)
  if (isRating) {
    if (!/^\d{1,6}$/.test(level)) return { error: "Informe um CS Rating numérico válido." }
    const rating = Number(level)
    if (rating < (game.ratingMin ?? 0) || rating > (game.ratingMax ?? 100000)) return { error: "O CS Rating está fora do intervalo permitido." }
  } else if (!game.rankOptions.includes(level)) {
    return { error: "Escolha um rank válido para o jogo e modo selecionados." }
  }

  return {
    value: {
      nickname,
      game: game.name,
      mode,
      platform,
      level,
      style,
      availability,
      role,
      secondaryRole,
      favorite,
    },
  }
}

const rateLimits = new Map<string, { count: number; resetAt: number }>()
function rateLimited(request: Request, key: string, maxAttempts: number, windowMs: number) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown"
  const limitKey = `${key}:${ip}`
  const now = Date.now()
  const current = rateLimits.get(limitKey)
  if (!current || current.resetAt <= now) {
    rateLimits.set(limitKey, { count: 1, resetAt: now + windowMs })
    if (rateLimits.size > 2000) {
      for (const [entry, value] of rateLimits) if (value.resetAt <= now) rateLimits.delete(entry)
    }
    return false
  }
  current.count += 1
  return current.count > maxAttempts
}

async function readJson(request: Request) {
  const length = Number(request.headers.get("content-length") || 0)
  if (length > 32_768) throw new Error("Corpo da solicitação excede o limite permitido.")
  return asRecord(await request.json())
}

const fileResponse = (file: URL, type: string) => new Response(Bun.file(file), {
  headers: { "Content-Type": `${type}; charset=utf-8`, "X-Content-Type-Options": "nosniff", "Cache-Control": "no-cache" },
})

const srv = Bun.serve({
  port:3000,
  routes: {
    "/": cadastro,
    "/cadastro": cadastro,
    "/cadastro.html": cadastro,
    "/login": login,
    "/login.html": login,
    "/main": main,
    "/main.html": main,
    "/inicio": main,
    "/inicio.html": main,
  },
  async fetch(request) {
    const url = new URL(request.url)

    if (request.method === "GET" && url.pathname === "/main.css") return fileResponse(new URL("./main.css", import.meta.url), "text/css")
    if (request.method === "GET" && url.pathname === "/main.js") return fileResponse(new URL("./main.js", import.meta.url), "text/javascript")
    if (request.method === "GET" && url.pathname === "/Pages.css") return fileResponse(new URL("../Pages.css", import.meta.url), "text/css")

    if (!url.pathname.startsWith("/api/")) return new Response("Not found", { status: 404 })
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method) && !assertSameOrigin(request)) {
      return json({ ok: false, message: "Origem da solicitação não permitida." }, 403)
    }

    try {
      if (url.pathname === "/api/games" && request.method === "GET") {
        return json({ ok: true, games: publicGameCatalog() })
      }

      if (url.pathname === "/api/register" && request.method === "POST") {
        if (rateLimited(request, "register", 8, 15 * 60 * 1000)) return json({ ok: false, message: "Muitas tentativas. Aguarde alguns minutos e tente novamente." }, 429)
        const data = await readJson(request)
        const username = cleanString(data.username, 32)
        const email = cleanString(data.email, 254).toLowerCase()
        const password = typeof data.password === "string" ? data.password : ""
        if (!/^[\p{L}\p{N} _.-]{2,32}$/u.test(username)) return json({ ok: false, message: "O nickname deve ter de 2 a 32 caracteres e não pode conter HTML." }, 400)
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, message: "Informe um e-mail válido." }, 400)
        if (password.length < 8 || password.length > 128) return json({ ok: false, message: "A senha deve ter entre 8 e 128 caracteres." }, 400)
        const exists = db.prepare("SELECT id FROM user WHERE email = ? OR username = ?").get(email, username)
        if (exists) return json({ ok: false, message: "E-mail ou nickname já cadastrados." }, 409)

        const passwordHash = await Bun.password.hash(password)
        const valorant = findGame("VALORANT")!
        const insert = db.transaction(() => {
          const result = db.prepare("INSERT INTO user (username, email, password_hash) VALUES (?, ?, ?)").run(username, email, passwordHash)
          const userId = Number(result.lastInsertRowid)
          db.prepare(`INSERT INTO profile (user_id, nickname, game, platform, level, style, availability, favorite, role, mode, secondary_role)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .run(userId, username, valorant.name, "PC", valorant.rankOptions[0] ?? "Ferro 1", "Casual", "Noites", "Jett", "Duelista", "Competitivo", "")
          db.prepare("INSERT INTO preferences (user_id, game, platform, time, favorite, role, mode, secondary_role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
            .run(userId, "", "", "", "", "", "", "")
          db.prepare("INSERT INTO settings (user_id) VALUES (?)").run(userId)
          return userId
        })
        insert()
        return json({ ok: true, message: "Conta criada com sucesso." }, 201)
      }

      if (url.pathname === "/api/login" && request.method === "POST") {
        if (rateLimited(request, "login", 12, 15 * 60 * 1000)) return json({ ok: false, message: "Muitas tentativas. Aguarde alguns minutos e tente novamente." }, 429)
        const data = await readJson(request)
        const email = cleanString(data.email, 254).toLowerCase()
        const password = typeof data.password === "string" ? data.password : ""
        if (!email || !password || password.length > 128) return json({ ok: false, message: "E-mail ou senha incorretos." }, 401)
        const user = getUserByEmail.get(email) as { id: number; username: string; email: string; password_hash: string } | undefined
        const valid = user ? await Bun.password.verify(password, user.password_hash) : false
        if (!user || !valid) return json({ ok: false, message: "E-mail ou senha incorretos." }, 401)
        db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(new Date().toISOString())
        const cookie = createSession(user.id, request)
        return json({ ok: true, user: { id: user.id, username: user.username, email: user.email } }, 200, { "Set-Cookie": cookie })
      }

      if (url.pathname === "/api/logout" && request.method === "POST") {
        const token = getCookie(request, SESSION_COOKIE)
        if (token) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token))
        return json({ ok: true }, 200, { "Set-Cookie": clearSessionCookie(request) })
      }

      if (url.pathname === "/api/me" && request.method === "GET") {
        const user = await authenticatedUser(request)
        if (!user) return json({ ok: false, message: "Sessão não autenticada." }, 401)
        const profile = getProfileByUserId.get(user.id) as Record<string, unknown> | undefined
        const preferences = getPreferencesByUserId.get(user.id) as Record<string, unknown> | undefined
        let settings = getSettingsByUserId.get(user.id) as { profile_public: number; show_availability: number } | undefined
        if (!settings) {
          db.prepare("INSERT OR IGNORE INTO settings (user_id) VALUES (?)").run(user.id)
          settings = { profile_public: 1, show_availability: 1 }
        }
        return json({ ok: true, user, profile: profile || null, preferences: preferences || null, settings })
      }

      if (url.pathname === "/api/profile" && request.method === "GET") {
        const user = await authenticatedUser(request)
        if (!user) return json({ ok: false, message: "Sessão não autenticada." }, 401)
        return json({ ok: true, profile: getProfileByUserId.get(user.id) || null })
      }

      if (url.pathname === "/api/profile" && request.method === "PUT") {
        const user = await authenticatedUser(request)
        if (!user) return json({ ok: false, message: "Sessão não autenticada." }, 401)
        const data = await readJson(request)
        const validated = validateProfile(data)
        if (validated.error) return json({ ok: false, message: validated.error }, 400)
        const value = validated.value!
        db.prepare(`INSERT INTO profile (user_id, nickname, game, platform, level, style, availability, favorite, role, mode, secondary_role)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET nickname=excluded.nickname, game=excluded.game, platform=excluded.platform,
            level=excluded.level, style=excluded.style, availability=excluded.availability, favorite=excluded.favorite,
            role=excluded.role, mode=excluded.mode, secondary_role=excluded.secondary_role`)
          .run(user.id, value.nickname, value.game, value.platform, value.level, value.style, value.availability, value.favorite, value.role, value.mode, value.secondaryRole)
        return json({ ok: true, profile: getProfileByUserId.get(user.id) })
      }

      if (url.pathname === "/api/preferences" && request.method === "GET") {
        const user = await authenticatedUser(request)
        if (!user) return json({ ok: false, message: "Sessão não autenticada." }, 401)
        return json({ ok: true, preferences: getPreferencesByUserId.get(user.id) || null })
      }

      if (url.pathname === "/api/preferences" && request.method === "PUT") {
        const user = await authenticatedUser(request)
        if (!user) return json({ ok: false, message: "Sessão não autenticada." }, 401)
        const data = await readJson(request)
        const game = cleanString(data.game, 80)
        const platform = cleanString(data.platform, 40)
        const time = cleanString(data.time, 40)
        const gameDefinition = game ? findGame(game) : null
        if (game && !gameDefinition) return json({ ok: false, message: "Jogo preferido inválido." }, 400)
        const currentProfile = getProfileByUserId.get(user.id) as Record<string, unknown> | undefined
        const platformGame = gameDefinition || findGame(String(currentProfile?.game ?? ""))
        if (platform && platformGame && !platformGame.platforms.includes(platform)) return json({ ok: false, message: "Plataforma preferida inválida para esse jogo." }, 400)
        if (time && !AVAILABILITY_OPTIONS.includes(time)) return json({ ok: false, message: "Horário preferido inválido." }, 400)
        db.prepare(`INSERT INTO preferences (user_id, game, platform, time, favorite, role, mode, secondary_role)
          VALUES (?, ?, ?, ?, '', '', '', '') ON CONFLICT(user_id) DO UPDATE SET game=excluded.game, platform=excluded.platform, time=excluded.time`)
          .run(user.id, game, platform, time)
        return json({ ok: true, preferences: getPreferencesByUserId.get(user.id) })
      }

      if (url.pathname === "/api/settings" && request.method === "GET") {
        const user = await authenticatedUser(request)
        if (!user) return json({ ok: false, message: "Sessão não autenticada." }, 401)
        let settings = getSettingsByUserId.get(user.id) as { profile_public: number; show_availability: number } | undefined
        if (!settings) {
          db.prepare("INSERT OR IGNORE INTO settings (user_id) VALUES (?)").run(user.id)
          settings = { profile_public: 1, show_availability: 1 }
        }
        return json({ ok: true, settings })
      }

      if (url.pathname === "/api/settings" && request.method === "PUT") {
        const user = await authenticatedUser(request)
        if (!user) return json({ ok: false, message: "Sessão não autenticada." }, 401)
        const data = await readJson(request)
        const settings = { profile_public: data.profile_public === true ? 1 : 0, show_availability: data.show_availability === true ? 1 : 0 }
        db.prepare(`INSERT INTO settings (user_id, profile_public, show_availability) VALUES (?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET profile_public=excluded.profile_public, show_availability=excluded.show_availability`)
          .run(user.id, settings.profile_public, settings.show_availability)
        return json({ ok: true, settings })
      }

      if (url.pathname === "/api/players" && request.method === "GET") {
        const user = await authenticatedUser(request)
        if (!user) return json({ ok: false, message: "Sessão não autenticada." }, 401)
        const profile = getProfileByUserId.get(user.id) as Record<string, unknown> | undefined
        const preferences = getPreferencesByUserId.get(user.id) as Record<string, unknown> | undefined
        if (!profile) return json({ ok: false, message: "Complete seu perfil antes de buscar jogadores." }, 400)
        const filterGame = cleanString(url.searchParams.get("game"), 80)
        const filterPlatform = cleanString(url.searchParams.get("platform"), 40)
        const filterLevel = cleanString(url.searchParams.get("level"), 80)
        const filterMode = cleanString(url.searchParams.get("mode"), 80)
        const filterRole = cleanString(url.searchParams.get("role"), 64)
        const filterFavorite = cleanString(url.searchParams.get("favorite"), 48)
        const minRating = cleanString(url.searchParams.get("minRating"), 8)
        if (minRating && !/^\d{1,6}$/.test(minRating)) return json({ ok: false, message: "CS Rating mínimo inválido." }, 400)
        const profiles = db.prepare(`
          SELECT p.user_id, p.nickname, p.game, p.platform, p.level, p.style,
            CASE WHEN COALESCE(s.show_availability, 1) = 1 THEN p.availability ELSE '' END AS availability,
            p.favorite, p.role, p.secondary_role, p.mode, u.username
          FROM profile p JOIN user u ON u.id = p.user_id
          LEFT JOIN settings s ON s.user_id = p.user_id
          WHERE p.user_id != ? AND COALESCE(s.profile_public, 1) = 1
            AND NOT EXISTS (SELECT 1 FROM friends f WHERE f.user_id = ? AND f.friend_id = p.user_id)
            AND NOT EXISTS (SELECT 1 FROM friend_requests fr
              WHERE ((fr.sender_id = ? AND fr.receiver_id = p.user_id) OR (fr.sender_id = p.user_id AND fr.receiver_id = ?))
                AND fr.status IN ('pending', 'accepted'))
        `).all(user.id, user.id, user.id, user.id) as Array<Record<string, unknown>>

        const viewerGame = cleanString(preferences?.game, 80) || String(profile.game)
        const viewer = {
          game: viewerGame,
          mode: String(profile.mode ?? ""),
          platform: cleanString(preferences?.platform, 40) || String(profile.platform ?? ""),
          availability: cleanString(preferences?.time, 40) || String(profile.availability ?? ""),
          level: viewerGame === profile.game ? String(profile.level ?? "") : "",
          role: String(profile.role ?? ""),
          favorite: String(profile.favorite ?? ""),
          style: String(profile.style ?? ""),
        }
        const filtered = profiles.filter((candidate) => {
          if (filterGame && candidate.game !== filterGame) return false
          if (filterPlatform && candidate.platform !== filterPlatform) return false
          if (filterLevel && candidate.level !== filterLevel) return false
          if (filterMode && candidate.mode !== filterMode) return false
          if (filterRole && candidate.role !== filterRole) return false
          if (filterFavorite) {
            const favorite = String(candidate.favorite ?? "").toLocaleLowerCase()
            const game = findGame(String(candidate.game ?? ""))
            const query = filterFavorite.toLocaleLowerCase()
            if (game?.freeTextFavorite ? !favorite.includes(query) : favorite !== query) return false
          }
          if (minRating) {
            if (candidate.game !== "Counter-Strike 2" || candidate.mode !== "Premier" || Number(candidate.level) < Number(minRating)) return false
          }
          return true
        }).map((candidate) => {
          const game = findGame(String(candidate.game))!
          const candidateForScoring = {
            game: String(candidate.game ?? ""), mode: String(candidate.mode ?? ""), level: String(candidate.level ?? ""),
            platform: String(candidate.platform ?? ""), availability: String(candidate.availability ?? ""),
            role: String(candidate.role ?? ""), favorite: String(candidate.favorite ?? ""), style: String(candidate.style ?? ""),
          }
          return {
            ...candidate,
            compatibility: calculateCompatibility(viewer, candidateForScoring, game),
            roleLabel: game.roleLabel,
            favoriteLabel: game.favoriteLabel,
          }
        }).sort((left, right) => Number(right.compatibility) - Number(left.compatibility))
        return json({ ok: true, players: filtered })
      }

      if (url.pathname === "/api/friend-request" && request.method === "POST") {
        const sender = await authenticatedUser(request)
        if (!sender) return json({ ok: false, message: "Sessão não autenticada." }, 401)
        const data = await readJson(request)
        const receiverId = Number(data.receiverId)
        if (!Number.isSafeInteger(receiverId) || receiverId <= 0 || receiverId === sender.id) return json({ ok: false, message: "Solicitação inválida." }, 400)
        const receiver = getUserById.get(receiverId)
        if (!receiver) return json({ ok: false, message: "Jogador não encontrado." }, 404)
        const alreadyFriends = db.prepare("SELECT id FROM friends WHERE user_id = ? AND friend_id = ?").get(sender.id, receiverId)
        if (alreadyFriends) return json({ ok: false, message: "Vocês já são amigos." }, 409)
        const reverse = db.prepare("SELECT id, status FROM friend_requests WHERE sender_id = ? AND receiver_id = ?").get(receiverId, sender.id) as { id: number; status: string } | undefined
        if (reverse?.status === "pending" || reverse?.status === "accepted") {
          const acceptReciprocal = db.transaction(() => {
            if (reverse.status === "pending") db.prepare("UPDATE friend_requests SET status = 'accepted' WHERE id = ?").run(reverse.id)
            saveFriendRelation.run(sender.id, receiverId)
            saveFriendRelation.run(receiverId, sender.id)
          })
          acceptReciprocal()
          return json({ ok: true, message: "Amizade criada." })
        }
        const existing = db.prepare("SELECT id, status FROM friend_requests WHERE sender_id = ? AND receiver_id = ?").get(sender.id, receiverId) as { id: number; status: string } | undefined
        if (existing?.status === "pending" || existing?.status === "accepted") return json({ ok: false, message: "A solicitação já existe." }, 409)
        if (existing?.status === "declined") {
          db.prepare("UPDATE friend_requests SET status = 'pending', created_at = CURRENT_TIMESTAMP WHERE id = ?").run(existing.id)
        } else {
          db.prepare("INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES (?, ?, 'pending')").run(sender.id, receiverId)
        }
        return json({ ok: true, message: "Solicitação enviada." }, 201)
      }

      if (url.pathname === "/api/friends" && request.method === "GET") {
        const user = await authenticatedUser(request)
        if (!user) return json({ ok: false, message: "Sessão não autenticada." }, 401)
        const requests = db.prepare(`SELECT fr.id, fr.sender_id, u.username AS sender_name
          FROM friend_requests fr JOIN user u ON u.id = fr.sender_id
          WHERE fr.receiver_id = ? AND fr.status = 'pending' ORDER BY fr.created_at DESC`).all(user.id)
        const friends = db.prepare(`SELECT f.friend_id AS id, u.username, p.nickname, p.game, p.platform, p.level, p.mode, p.role, p.secondary_role, p.favorite,
          CASE WHEN COALESCE(s.show_availability, 1) = 1 THEN p.availability ELSE '' END AS availability
          FROM friends f JOIN user u ON u.id = f.friend_id
          LEFT JOIN profile p ON p.user_id = f.friend_id LEFT JOIN settings s ON s.user_id = f.friend_id
          WHERE f.user_id = ? ORDER BY u.username COLLATE NOCASE`).all(user.id) as Array<Record<string, unknown>>
        return json({ ok: true, requests, friends })
      }

      if (["/api/friends/accept", "/api/friends/decline"].includes(url.pathname) && request.method === "POST") {
        const user = await authenticatedUser(request)
        if (!user) return json({ ok: false, message: "Sessão não autenticada." }, 401)
        const data = await readJson(request)
        const requestId = Number(data.requestId)
        if (!Number.isSafeInteger(requestId) || requestId <= 0) return json({ ok: false, message: "Solicitação inválida." }, 400)
        const friendRequest = db.prepare("SELECT id, sender_id, receiver_id FROM friend_requests WHERE id = ? AND receiver_id = ? AND status = 'pending'").get(requestId, user.id) as { id: number; sender_id: number; receiver_id: number } | undefined
        if (!friendRequest) return json({ ok: false, message: "Solicitação não encontrada." }, 404)
        if (url.pathname.endsWith("/accept")) {
          const accept = db.transaction(() => {
            db.prepare("UPDATE friend_requests SET status = 'accepted' WHERE id = ?").run(requestId)
            saveFriendRelation.run(friendRequest.receiver_id, friendRequest.sender_id)
            saveFriendRelation.run(friendRequest.sender_id, friendRequest.receiver_id)
          })
          accept()
          return json({ ok: true, message: "Amizade aceita." })
        }
        db.prepare("UPDATE friend_requests SET status = 'declined' WHERE id = ?").run(requestId)
        return json({ ok: true, message: "Solicitação recusada." })
      }

      if (url.pathname === "/api/account" && request.method === "DELETE") {
        const user = await authenticatedUser(request)
        if (!user) return json({ ok: false, message: "Sessão não autenticada." }, 401)
        const remove = db.transaction(() => {
          db.prepare("DELETE FROM friend_requests WHERE sender_id = ? OR receiver_id = ?").run(user.id, user.id)
          db.prepare("DELETE FROM friends WHERE user_id = ? OR friend_id = ?").run(user.id, user.id)
          db.prepare("DELETE FROM settings WHERE user_id = ?").run(user.id)
          db.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id)
          db.prepare("DELETE FROM preferences WHERE user_id = ?").run(user.id)
          db.prepare("DELETE FROM profile WHERE user_id = ?").run(user.id)
          db.prepare("DELETE FROM user WHERE id = ?").run(user.id)
        })
        remove()
        return json({ ok: true, message: "Conta excluída." }, 200, { "Set-Cookie": clearSessionCookie(request) })
      }

      return json({ ok: false, message: "Rota de API não encontrada." }, 404)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro interno."
      if (message.includes("Body") || message.includes("JSON")) return json({ ok: false, message: "Dados inválidos." }, 400)
      console.error("API error:", error)
      return json({ ok: false, message: "Erro interno. Tente novamente." }, 500)
    }
  },
  error(error) {
    console.error("Request error:", error)
    return json({ ok: false, message: "Erro interno. Tente novamente." }, 500)
  },
})

console.log(`DuoPlay server running at ${srv.url}`)
