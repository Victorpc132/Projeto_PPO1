import cadastro from "../cadastro.html"
import login from "../login.html"
import main from "./main.html"
import { db } from "./db"

const chosenPort = Number(process.env.PORT ?? 0)

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}

const getUserByEmail = db.prepare(`
  SELECT id, username, email, password_hash
  FROM user
  WHERE email = ?
`)

const getUserById = db.prepare(`
  SELECT id, username, email
  FROM user
  WHERE id = ?
`)

const getProfileByUserId = db.prepare(`
  SELECT * FROM profile WHERE user_id = ?
`)

const getPreferencesByUserId = db.prepare(`
  SELECT * FROM preferences WHERE user_id = ?
`)

const getRequestsByUserId = db.prepare(`
  SELECT fr.id, fr.sender_id, fr.receiver_id, fr.status, u.username as sender_name
  FROM friend_requests fr
  JOIN user u ON u.id = fr.sender_id
  WHERE fr.receiver_id = ? AND fr.status = 'pending'
`)

const getFriendsByUserId = db.prepare(`
  SELECT f.friend_id as id, u.username, p.nickname, p.game, p.platform
  FROM friends f
  JOIN user u ON u.id = f.friend_id
  LEFT JOIN profile p ON p.user_id = f.friend_id
  WHERE f.user_id = ?
`)

const saveFriendRelation = db.prepare(`
  INSERT OR IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)
`)

const GAME_METADATA: Record<string, { ranks: Record<string, number>; specialties: string[]; roles: string[]; specialtyLabel: string; roleLabel: string }> = {
  Valorant: {
    ranks: { Ferro: 1, Bronze: 2, Prata: 3, Ouro: 4, Platina: 5, Ascendente: 6, Diamante: 7, Imortal: 8, Radiante: 9 },
    specialties: ["Jett", "Raze", "Sova", "Fade", "Viper", "Omen", "Killjoy", "Phoenix", "Sage", "Astra", "Reyna", "Chamber", "Neon", "Yoru", "Breach", "Skye", "Brimstone", "KAY/O", "Iso", "Clove"],
    roles: ["Duelista", "Controlador", "Iniciador", "Sentinela"],
    specialtyLabel: "Agente favorito",
    roleLabel: "Função",
  },
  "League of Legends": {
    ranks: { Ferro: 1, Bronze: 2, Prata: 3, Ouro: 4, Platina: 5, Ascendente: 6, Diamante: 7, Imortal: 8, Radiante: 9 },
    specialties: ["Ahri", "Garen", "Yasuo", "Ezreal", "Thresh", "LeBlanc", "Jinx", "Lee Sin", "Riven", "Lux", "Darius", "Nautilus", "Zed", "Seraphine", "Sett"],
    roles: ["Topo", "Caçador", "Meio", "Atirador", "Suporte"],
    specialtyLabel: "Campeão favorito",
    roleLabel: "Função",
  },
  Fortnite: {
    ranks: { Bronze: 1, Prata: 2, Ouro: 3, Platina: 4, Diamante: 5, Elite: 6, Mestre: 7, Campeão: 8 },
    specialties: ["Builder", "Skirmisher", "Controller", "Rusher", "Flex"],
    roles: ["Frente", "Suporte", "Flex", "Atirador", "Controle"],
    specialtyLabel: "Estilo favorito",
    roleLabel: "Papel",
  },
  "Counter-Strike 2": {
    ranks: { Ferro: 1, Bronze: 2, Prata: 3, Ouro: 4, Platina: 5, Ascendente: 6, Diamante: 7, Imortal: 8, Radiante: 9 },
    specialties: ["AWP", "Entry", "Lurker", "IGL", "Anchor", "Support"],
    roles: ["Entry", "AWP", "Support", "IGL", "Lurker"],
    specialtyLabel: "Especialidade",
    roleLabel: "Papel",
  },
  "Apex Legends": {
    ranks: { Bronze: 1, Prata: 2, Ouro: 3, Platina: 4, Diamante: 5, Mestre: 6, Predator: 7, "Elite": 8, "Campeão": 9 },
    specialties: ["Wraith", "Bangalore", "Octane", "Lifeline", "Pathfinder", "Gibraltar", "Caustic", "Valkyrie", "Ash", "Bloodhound", "Mirage"],
    roles: ["Frente", "Furtivo", "Suporte", "Controle", "Flex"],
    specialtyLabel: "Legenda favorita",
    roleLabel: "Papel",
  },
}

const getRankValue = (rank?: string) => {
  if (!rank) return 0
  for (const game of Object.values(GAME_METADATA)) {
    const value = game.ranks[rank]
    if (value) return value
  }
  return 0
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const compareRanks = (left?: string, right?: string) => {
  const leftValue = getRankValue(left)
  const rightValue = getRankValue(right)
  if (!leftValue || !rightValue) return 0
  const diff = Math.abs(leftValue - rightValue)
  if (diff === 0) return 28
  if (diff === 1) return 22
  if (diff === 2) return 16
  if (diff <= 3) return 10
  return 4
}

const sameOrRelated = (left?: string, right?: string) => {
  if (!left || !right) return 0
  return left === right ? 1 : 0.5
}

const calculateCompatibility = (currentPlayer: Record<string, unknown>, targetPlayer: Record<string, unknown>) => {
  const preference = currentPlayer ?? {}
  const target = targetPlayer ?? {}

  let score = 0

  if (preference.game && target.game && preference.game === target.game) score += 24
  else if (preference.game && target.game) score += 2

  if (preference.platform && target.platform && preference.platform === target.platform) score += 10
  else if (preference.platform && target.platform) score += 4

  score += compareRanks(String(preference.level ?? ""), String(target.level ?? ""))

  if (preference.style && target.style && preference.style === target.style) score += 15
  else if (preference.style && target.style) score += 6 + (sameOrRelated(String(preference.style), String(target.style)) * 6)

  if (preference.availability && target.availability && preference.availability === target.availability) score += 16
  else if (preference.availability && target.availability) score += 6

  if (preference.favorite && target.favorite && preference.favorite === target.favorite) score += 8
  else if (preference.favorite && target.favorite) score += 3

  if (preference.role && target.role && preference.role === target.role) score += 8
  else if (preference.role && target.role) score += 3

  const gameBias = preference.game && target.game ? (preference.game === target.game ? 1 : 0.15) : 0.5
  const timeBias = preference.availability && target.availability ? (preference.availability === target.availability ? 1 : 0.35) : 0.5
  score = Math.round(score * (0.8 + gameBias * 0.35 + timeBias * 0.2))

  return clamp(Math.round(score), 0, 100)
}

const buildGameOptions = (game: string) => {
  const fallback = GAME_METADATA.Valorant
  const config: {
    ranks: Record<string, number>
    specialties: string[]
    roles: string[]
    specialtyLabel: string
    roleLabel: string
  } = (GAME_METADATA[game] ?? fallback) as {
    ranks: Record<string, number>
    specialties: string[]
    roles: string[]
    specialtyLabel: string
    roleLabel: string
  }

  return {
    specialtyLabel: config.specialtyLabel,
    roleLabel: config.roleLabel,
    specialities: config.specialties,
    roles: config.roles,
  }
}

const srv = Bun.serve({
  port: chosenPort || 0,
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
  fetch(req) {
    const url = new URL(req.url)

    if (url.pathname === "/api/register" && req.method === "POST") {
      return req.json().then((payload) => {
        const data = asRecord(payload)
        const username = String(data.username ?? "").trim()
        const email = String(data.email ?? "").trim().toLowerCase()
        const password = String(data.password ?? "")

        if (!username || !email || !password) {
          return json({ ok: false, message: "Preencha todos os campos." }, 400)
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return json({ ok: false, message: "E-mail inválido." }, 400)
        }

        if (password.length < 6) {
          return json({ ok: false, message: "A senha deve ter pelo menos 6 caracteres." }, 400)
        }

        const existingUser = db.prepare(`SELECT id FROM user WHERE email = ? OR username = ?`).get(email, username) as { id: number } | undefined
        if (existingUser) {
          return json({ ok: false, message: "Usuário ou e-mail já cadastrados." }, 409)
        }

        const passwordHash = Bun.password.hashSync(password)
        const result = db.prepare(`
          INSERT INTO user (username, email, password_hash)
          VALUES (?, ?, ?)
        `).run(username, email, passwordHash)

        const userId = Number(result.lastInsertRowid)
        db.prepare(`INSERT INTO profile (user_id, nickname, game, platform, level, style, availability, favorite, role)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .run(userId, username, "Valorant", "PC", "Prata", "Estratégico", "Noites", "Jett", "Duelista")
        db.prepare(`INSERT INTO preferences (user_id, game, platform, time, favorite, role)
          VALUES (?, ?, ?, ?, ?, ?)`)
          .run(userId, "Valorant", "PC", "Noites", "Jett", "Duelista")

        return json({ ok: true, message: "Conta criada com sucesso." })
      }).catch(() => json({ ok: false, message: "Dados inválidos." }, 400))
    }

    if (url.pathname === "/api/login" && req.method === "POST") {
      return req.json().then(async (payload) => {
        const data = asRecord(payload)
        const email = String(data.email ?? "").trim().toLowerCase()
        const password = String(data.password ?? "")

        if (!email || !password) {
          return json({ ok: false, message: "Informe e-mail e senha." }, 400)
        }

        const user = getUserByEmail.get(email) as { id: number; username: string; email: string; password_hash: string } | undefined
        if (!user) {
          return json({ ok: false, message: "E-mail ou senha incorretos." }, 401)
        }

        const isValid = await Bun.password.verify(password, user.password_hash)
        if (!isValid) {
          return json({ ok: false, message: "E-mail ou senha incorretos." }, 401)
        }

        return json({
          ok: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
          },
        })
      }).catch(() => json({ ok: false, message: "Dados inválidos." }, 400))
    }

    if (url.pathname === "/api/account" && req.method === "DELETE") {
      return req.json().then((payload) => {
        const data = asRecord(payload)
        const userId = Number(data.userId)

        if (!userId) {
          return json({ ok: false, message: "Usuário não autenticado." }, 401)
        }

        const user = getUserById.get(userId) as { id: number; username: string; email: string } | undefined
        if (!user) {
          return json({ ok: false, message: "Usuário não encontrado." }, 404)
        }

        db.prepare(`DELETE FROM friend_requests WHERE sender_id = ? OR receiver_id = ?`).run(userId, userId)
        db.prepare(`DELETE FROM friends WHERE user_id = ? OR friend_id = ?`).run(userId, userId)
        db.prepare(`DELETE FROM profile WHERE user_id = ?`).run(userId)
        db.prepare(`DELETE FROM preferences WHERE user_id = ?`).run(userId)
        db.prepare(`DELETE FROM user WHERE id = ?`).run(userId)

        return json({ ok: true, message: "Conta excluída com sucesso." })
      }).catch(() => json({ ok: false, message: "Dados inválidos." }, 400))
    }

    if (url.pathname === "/api/profile" && req.method === "POST") {
      return req.json().then((payload) => {
        const data = asRecord(payload)
        const userId = Number(data.userId)
        const nickname = String(data.nickname ?? "").trim()
        const game = String(data.game ?? "")
        const platform = String(data.platform ?? "")
        const level = String(data.level ?? "")
        const style = String(data.style ?? "")
        const availability = String(data.availability ?? "")
        const favorite = String(data.favorite ?? "")
        const role = String(data.role ?? "")

        if (!userId) {
          return json({ ok: false, message: "Usuário não autenticado." }, 401)
        }

        const user = getUserById.get(userId) as { id: number; username: string; email: string } | undefined
        if (!user) {
          return json({ ok: false, message: "Usuário não encontrado." }, 404)
        }

        db.prepare(`
          INSERT INTO profile (user_id, nickname, game, platform, level, style, availability, favorite, role)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET
            nickname = excluded.nickname,
            game = excluded.game,
            platform = excluded.platform,
            level = excluded.level,
            style = excluded.style,
            availability = excluded.availability,
            favorite = excluded.favorite,
            role = excluded.role
        `).run(userId, nickname || user.username, game, platform, level, style, availability, favorite, role)

        return json({ ok: true, message: "Perfil salvo com sucesso." })
      }).catch(() => json({ ok: false, message: "Dados inválidos." }, 400))
    }

    if (url.pathname === "/api/profile" && req.method === "GET") {
      const userId = Number(url.searchParams.get("userId"))
      if (!userId) {
        return json({ ok: false, message: "Usuário não autenticado." }, 401)
      }

      const profile = getProfileByUserId.get(userId) as Record<string, string | number> | undefined
      return json({ ok: true, profile: profile ?? null })
    }

    if (url.pathname === "/api/preferences" && req.method === "POST") {
      return req.json().then((payload) => {
        const data = asRecord(payload)
        const userId = Number(data.userId)
        const game = String(data.game ?? "")
        const platform = String(data.platform ?? "")
        const time = String(data.time ?? "")
        const favorite = String(data.favorite ?? "")
        const role = String(data.role ?? "")

        if (!userId) {
          return json({ ok: false, message: "Usuário não autenticado." }, 401)
        }

        db.prepare(`
          INSERT INTO preferences (user_id, game, platform, time, favorite, role)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET
            game = excluded.game,
            platform = excluded.platform,
            time = excluded.time,
            favorite = excluded.favorite,
            role = excluded.role
        `).run(userId, game, platform, time, favorite, role)

        return json({ ok: true, message: "Preferências salvas com sucesso." })
      }).catch(() => json({ ok: false, message: "Dados inválidos." }, 400))
    }

    if (url.pathname === "/api/preferences" && req.method === "GET") {
      const userId = Number(url.searchParams.get("userId"))
      if (!userId) {
        return json({ ok: false, message: "Usuário não autenticado." }, 401)
      }

      const preferences = getPreferencesByUserId.get(userId) as Record<string, string | number> | undefined
      return json({ ok: true, preferences: preferences ?? null })
    }

    if (url.pathname === "/api/players" && req.method === "GET") {
      const userId = Number(url.searchParams.get("userId"))
      const game = url.searchParams.get("game") ?? "Todos os jogos"
      const platform = url.searchParams.get("platform") ?? "Todas"
      const level = url.searchParams.get("level") ?? "Todos os níveis"

      if (!userId) {
        return json({ ok: false, message: "Usuário não autenticado." }, 401)
      }

      const currentProfile = getProfileByUserId.get(userId) as Record<string, string | number> | undefined
      const currentPreferences = getPreferencesByUserId.get(userId) as Record<string, string | number> | undefined
      const rows = db.prepare(`
        SELECT p.user_id, p.nickname, p.game, p.platform, p.level, p.style, p.availability, p.favorite, p.role, u.username
        FROM profile p
        JOIN user u ON u.id = p.user_id
        WHERE p.user_id != ?
          AND NOT EXISTS (
            SELECT 1 FROM friends f WHERE f.user_id = ? AND f.friend_id = p.user_id
          )
          AND NOT EXISTS (
            SELECT 1 FROM friend_requests fr
            WHERE ((fr.sender_id = ? AND fr.receiver_id = p.user_id) OR (fr.sender_id = p.user_id AND fr.receiver_id = ?))
              AND fr.status IN ('pending', 'accepted')
          )
      `).all(userId, userId, userId, userId) as Array<Record<string, unknown>>

      const filtered = rows
        .filter((player) => {
          const matchGame = game === "Todos os jogos" || player.game === game
          const matchPlatform = platform === "Todas" || player.platform === platform
          const matchLevel = level === "Todos os níveis" || player.level === level
          return matchGame && matchPlatform && matchLevel
        })
        .map((player) => {
          const score = calculateCompatibility((currentProfile ?? currentPreferences ?? {}) as Record<string, unknown>, player)
          return { ...player, compatibility: score }
        })
        .sort((a, b) => Number(b.compatibility) - Number(a.compatibility))

      return json({ ok: true, players: filtered })
    }

    if (url.pathname === "/api/friend-request" && req.method === "POST") {
      return req.json().then((payload) => {
        const data = asRecord(payload)
        const senderId = Number(data.senderId)
        const receiverId = Number(data.receiverId)

        if (!senderId || !receiverId || senderId === receiverId) {
          return json({ ok: false, message: "Solicitação inválida." }, 400)
        }

        const sender = getUserById.get(senderId) as { id: number } | undefined
        const receiver = getUserById.get(receiverId) as { id: number } | undefined
        if (!sender || !receiver) {
          return json({ ok: false, message: "Usuário não encontrado." }, 404)
        }

        const existing = db.prepare(`
          SELECT id FROM friend_requests WHERE sender_id = ? AND receiver_id = ?
        `).get(senderId, receiverId) as { id: number } | undefined

        const alreadyFriend = db.prepare(`
          SELECT id FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
        `).get(senderId, receiverId, receiverId, senderId) as { id: number } | undefined

        if (existing || alreadyFriend) {
          return json({ ok: false, message: "Solicitação já enviada ou amizade já existente." }, 409)
        }

        db.prepare(`
          INSERT INTO friend_requests (sender_id, receiver_id, status)
          VALUES (?, ?, 'pending')
        `).run(senderId, receiverId)

        return json({ ok: true, message: "Pedido enviado com sucesso." })
      }).catch(() => json({ ok: false, message: "Dados inválidos." }, 400))
    }

    if (url.pathname === "/api/friends" && req.method === "GET") {
      const userId = Number(url.searchParams.get("userId"))
      if (!userId) {
        return json({ ok: false, message: "Usuário não autenticado." }, 401)
      }

      const requests = getRequestsByUserId.all(userId) as Array<Record<string, unknown>>
      const friends = getFriendsByUserId.all(userId) as Array<Record<string, unknown>>

      return json({ ok: true, requests, friends })
    }

    if (url.pathname.startsWith("/api/friends/accept") && req.method === "POST") {
      return req.json().then((payload) => {
        const data = asRecord(payload)
        const requestId = Number(data.requestId)
        const userId = Number(data.userId)

        if (!requestId || !userId) {
          return json({ ok: false, message: "Dados incompletos." }, 400)
        }

        const request = db.prepare(`
          SELECT sender_id, receiver_id FROM friend_requests WHERE id = ? AND receiver_id = ? AND status = 'pending'
        `).get(requestId, userId) as { sender_id: number; receiver_id: number } | undefined

        if (!request) {
          return json({ ok: false, message: "Solicitação não encontrada." }, 404)
        }

        db.prepare(`
          UPDATE friend_requests SET status = 'accepted' WHERE id = ?
        `).run(requestId)

        saveFriendRelation.run(request.receiver_id, request.sender_id)
        saveFriendRelation.run(request.sender_id, request.receiver_id)

        return json({ ok: true, message: "Amizade aceita." })
      }).catch(() => json({ ok: false, message: "Dados inválidos." }, 400))
    }

    if (url.pathname.startsWith("/api/friends/decline") && req.method === "POST") {
      return req.json().then((payload) => {
        const data = asRecord(payload)
        const requestId = Number(data.requestId)
        const userId = Number(data.userId)

        if (!requestId || !userId) {
          return json({ ok: false, message: "Dados incompletos." }, 400)
        }

        const request = db.prepare(`
          SELECT id FROM friend_requests WHERE id = ? AND receiver_id = ? AND status = 'pending'
        `).get(requestId, userId) as { id: number } | undefined

        if (!request) {
          return json({ ok: false, message: "Solicitação não encontrada." }, 404)
        }

        db.prepare(`
          UPDATE friend_requests SET status = 'declined' WHERE id = ?
        `).run(requestId)

        return json({ ok: true, message: "Solicitação recusada." })
      }).catch(() => json({ ok: false, message: "Dados inválidos." }, 400))
    }

    return new Response("Not found", { status: 404 })
  },
})

console.log(`Server running on ${srv.url}`)