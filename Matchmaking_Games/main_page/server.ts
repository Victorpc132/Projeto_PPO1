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
        const username = String(payload?.username ?? "").trim()
        const email = String(payload?.email ?? "").trim().toLowerCase()
        const password = String(payload?.password ?? "")

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
        db.prepare(`INSERT INTO profile (user_id, nickname) VALUES (?, ?)`).run(userId, username)
        db.prepare(`INSERT INTO preferences (user_id, game, platform, time) VALUES (?, ?, ?, ?)`).run(userId, "Valorant", "PC", "Noites")

        return json({ ok: true, message: "Conta criada com sucesso." })
      }).catch(() => json({ ok: false, message: "Dados inválidos." }, 400))
    }

    if (url.pathname === "/api/login" && req.method === "POST") {
      return req.json().then(async (payload) => {
        const email = String(payload?.email ?? "").trim().toLowerCase()
        const password = String(payload?.password ?? "")

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

    if (url.pathname === "/api/profile" && req.method === "POST") {
      return req.json().then((payload) => {
        const userId = Number(payload?.userId)
        const nickname = String(payload?.nickname ?? "").trim()
        const game = String(payload?.game ?? "")
        const platform = String(payload?.platform ?? "")
        const level = String(payload?.level ?? "")
        const style = String(payload?.style ?? "")
        const availability = String(payload?.availability ?? "")

        if (!userId) {
          return json({ ok: false, message: "Usuário não autenticado." }, 401)
        }

        const user = getUserById.get(userId) as { id: number; username: string; email: string } | undefined
        if (!user) {
          return json({ ok: false, message: "Usuário não encontrado." }, 404)
        }

        db.prepare(`
          INSERT INTO profile (user_id, nickname, game, platform, level, style, availability)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET
            nickname = excluded.nickname,
            game = excluded.game,
            platform = excluded.platform,
            level = excluded.level,
            style = excluded.style,
            availability = excluded.availability
        `).run(userId, nickname || user.username, game, platform, level, style, availability)

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
        const userId = Number(payload?.userId)
        const game = String(payload?.game ?? "")
        const platform = String(payload?.platform ?? "")
        const time = String(payload?.time ?? "")

        if (!userId) {
          return json({ ok: false, message: "Usuário não autenticado." }, 401)
        }

        db.prepare(`
          INSERT INTO preferences (user_id, game, platform, time)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET
            game = excluded.game,
            platform = excluded.platform,
            time = excluded.time
        `).run(userId, game, platform, time)

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

      const rows = db.prepare(`
        SELECT p.user_id, p.nickname, p.game, p.platform, p.level, p.style, p.availability, u.username
        FROM profile p
        JOIN user u ON u.id = p.user_id
        WHERE p.user_id != ?
      `).all(userId || 0) as Array<Record<string, unknown>>

      const filtered = rows.filter((player) => {
        const matchGame = game === "Todos os jogos" || player.game === game
        const matchPlatform = platform === "Todas" || player.platform === platform
        const matchLevel = level === "Todos os níveis" || player.level === level
        return matchGame && matchPlatform && matchLevel
      })

      return json({ ok: true, players: filtered })
    }

    if (url.pathname === "/api/friend-request" && req.method === "POST") {
      return req.json().then((payload) => {
        const senderId = Number(payload?.senderId)
        const receiverId = Number(payload?.receiverId)

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

        if (existing) {
          return json({ ok: false, message: "Solicitação já enviada." }, 409)
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
        const requestId = Number(payload?.requestId)
        const userId = Number(payload?.userId)

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
        const requestId = Number(payload?.requestId)
        const userId = Number(payload?.userId)

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