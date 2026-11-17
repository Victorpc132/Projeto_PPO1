import { describe, expect, it } from "bun:test"
import { GAME_CATALOG, findGame } from "../Matchmaking_Games/main_page/gameCatalog"
import { calculateCompatibility } from "../Matchmaking_Games/main_page/matchmaking"

describe("catálogo dos jogos", () => {
  it("contém todos os cinco jogos suportados e opções sem duplicatas", () => {
    expect(GAME_CATALOG.map((game) => game.name)).toEqual([
      "VALORANT",
      "League of Legends",
      "Fortnite",
      "Counter-Strike 2",
      "Apex Legends",
    ])
    for (const game of GAME_CATALOG) {
      expect(game.rankOptions.length).toBeGreaterThan(0)
      expect(new Set(game.rankOptions).size).toBe(game.rankOptions.length)
      expect(new Set(game.modes).size).toBe(game.modes.length)
    }
  })

  it("representa os tiers próprios de cada jogo", () => {
    const valorant = findGame("VALORANT")!
    expect(valorant.rankOptions).toContain("Radiante")
    expect(valorant.rankOptions).toContain("Imortal 3")
    expect(valorant.favorites).toContain("Miks")
    expect(valorant.rankScope).toBe("platform")

    const league = findGame("League of Legends")!
    expect(league.rankOptions).toContain("Esmeralda IV")
    expect(league.rankOptions).toContain("Grão-mestre")
    expect(league.modes).toEqual(["Solo/Duo", "Flex"])
    expect(league.secondaryRoles).toHaveLength(5)

    const fortnite = findGame("Fortnite")!
    expect(fortnite.rankOptions).toContain("Bronze I")
    expect(fortnite.rankOptions).toContain("Campeão III")
    expect(fortnite.rankOptions).toContain("Unreal III")
    expect(fortnite.rankOptions).toContain("Unreal Legends")
    expect(fortnite.rankModeGroups).toEqual([["Battle Royale", "Zero Build"]])

    const cs2 = findGame("Counter-Strike 2")!
    expect(cs2.rankOptions).toHaveLength(18)
    expect(cs2.ratingMode).toBe("Premier")
    expect(cs2.rankScope).toBe("favorite")
    expect(cs2.rankResetOnModeChange).toBe(true)

    const apex = findGame("Apex Legends")!
    expect(apex.rankOptions).toContain("Apex Predator")
    expect(apex.favorites).toContain("Axle")
    expect(apex.rankScope).toBe("platform")
  })
})

describe("cálculo de compatibilidade", () => {
  it("dá 100 quando todos os critérios coincidem dentro da mesma escala", () => {
    const game = findGame("VALORANT")!
    const player = {
      game: game.name, mode: "Competitivo", level: "Diamante 2", availability: "Noites",
      role: "Duelista", favorite: "Jett", style: "Competitivo", platform: "PC",
    }
    expect(calculateCompatibility(player, player, game)).toBe(100)
  })

  it("não compara tiers homônimos de jogos diferentes", () => {
    const valorant = findGame("VALORANT")!
    const a = { game: "VALORANT", mode: "Competitivo", level: "Ouro 1", availability: "Noites", platform: "PC" }
    const b = { game: "Apex Legends", mode: "Ranked", level: "Ouro 1", availability: "Noites", platform: "PC" }
    expect(calculateCompatibility(a, b, valorant)).toBe(30)
  })

  it("não soma rank entre filas Solo/Duo e Flex do LoL", () => {
    const game = findGame("League of Legends")!
    const a = { game: game.name, mode: "Solo/Duo", level: "Diamante I", availability: "Noites", platform: "PC" }
    const b = { ...a, mode: "Flex" }
    expect(calculateCompatibility(a, b, game)).toBe(50)
  })

  it("só compara grupo de CS2 Competitive quando o mapa é o mesmo", () => {
    const game = findGame("Counter-Strike 2")!
    const a = { game: game.name, mode: "Competitivo (por mapa)", level: "Global Elite", favorite: "Mirage", availability: "Noites", platform: "PC" }
    const sameMap = { ...a }
    const otherMap = { ...a, favorite: "Inferno" }
    expect(calculateCompatibility(a, sameMap, game) - calculateCompatibility(a, otherMap, game)).toBe(28)
  })

  it("compara CS Rating numérico no Premier, sem exigir um mapa", () => {
    const game = findGame("Counter-Strike 2")!
    const a = { game: game.name, mode: "Premier", level: "12000", availability: "Noites", role: "AWPer", platform: "PC" }
    const sameRating = { ...a }
    const farRating = { ...a, level: "20000" }
    expect(calculateCompatibility(a, sameRating, game)).toBe(95)
    expect(calculateCompatibility(a, farRating, game)).toBe(70)
  })



  it("não premia metadados vazios ou disponibilidade privada", () => {
    const game = findGame("VALORANT")!
    const a = { game: game.name, mode: "Competitivo", level: "Ferro 1", platform: "PC", availability: "", role: "", favorite: "", style: "" }
    expect(calculateCompatibility(a, a, game)).toBe(65)
  })

  it("não compara o rank de VALORANT entre PC e console", () => {
    const game = findGame("VALORANT")!
    const a = { game: game.name, mode: "Competitivo", level: "Diamante II", platform: "PC", availability: "Noites", role: "Duelista", favorite: "Jett", style: "Competitivo" }
    const b = { ...a, platform: "Xbox" }
    expect(calculateCompatibility(a, b, game)).toBe(65)
  })

  it("não compara o rank Apex entre plataformas diferentes", () => {
    const game = findGame("Apex Legends")!
    const a = { game: game.name, mode: "Ranked", level: "Mestre", availability: "Noites", platform: "PC" }
    const b = { ...a, platform: "PlayStation" }
    expect(calculateCompatibility(a, b, game)).toBe(50)
  })

  it("não cruza o rank Fortnite de Reload com Battle Royale", () => {
    const game = findGame("Fortnite")!
    const a = { game: game.name, mode: "Reload", level: "Diamante II", availability: "Noites", platform: "PC" }
    const b = { ...a, mode: "Reload Zero Build" }
    expect(calculateCompatibility(a, b, game)).toBe(50)
  })

  it("permite comparar progresso Fortnite compartilhado entre modos", () => {
    const game = findGame("Fortnite")!
    const a = { game: game.name, mode: "Battle Royale", level: "Diamante II", availability: "Noites", platform: "PC" }
    const b = { ...a, mode: "Zero Build" }
    expect(calculateCompatibility(a, b, game)).toBe(75)
  })
})


describe("dados legados", () => {
  it("não atribui pontos de rank a valores antigos fora do catálogo", () => {
    const game = findGame("VALORANT")!
    const a = { game: game.name, mode: "Competitivo", level: "Iniciante", availability: "Noites", platform: "PC" }
    const b = { ...a }
    expect(calculateCompatibility(a, b, game)).toBe(60)
  })
})
