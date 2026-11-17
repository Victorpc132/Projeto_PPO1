export interface GameDefinition {
  id: string
  name: string
  platforms: string[]
  rankLabel: string
  rankOptions: string[]
  rankHelp: string
  modes: string[]
  modeLabel: string
  roles: string[]
  roleLabel: string
  secondaryRoles?: string[]
  secondaryRoleLabel?: string
  favorites: string[]
  favoriteLabel: string
  freeTextFavorite?: boolean
  favoriteModes?: string[]
  ratingMode?: string
  ratingLabel?: string
  ratingHelp?: string
  ratingMin?: number
  ratingMax?: number
  ratingMatchRange?: number
  rankScope?: "favorite" | "platform"
  rankSharedAcrossModes?: boolean
  rankModeGroups?: string[][]
  rankResetOnModeChange?: boolean
  note?: string
  sourceUrls: string[]
}

const tiersWithThreeLevels = (tiers: string[]) =>
  tiers.flatMap((tier) => [`${tier} 1`, `${tier} 2`, `${tier} 3`])

const tiersWithRomanDivisions = (tiers: string[]) =>
  tiers.flatMap((tier) => [`${tier} I`, `${tier} II`, `${tier} III`])

const tiersWithFourDivisions = (tiers: string[]) =>
  tiers.flatMap((tier) => [`${tier} IV`, `${tier} III`, `${tier} II`, `${tier} I`])

export const GAME_CATALOG: GameDefinition[] = [
  {
    id: "valorant",
    name: "VALORANT",
    platforms: ["PC", "PlayStation", "Xbox"],
    rankLabel: "Rank competitivo",
    rankOptions: [
      ...tiersWithThreeLevels(["Ferro", "Bronze", "Prata", "Ouro", "Platina", "Diamante", "Ascendente", "Imortal"]),
      "Radiante",
    ],
    rankHelp: "Ferro até Imortal têm níveis 1–3. Radiante não tem divisão numerada.",
    modes: ["Competitivo", "Sem classificação", "Swiftplay"],
    modeLabel: "Modo preferido",
    roles: ["Controlador", "Duelista", "Iniciador", "Sentinela"],
    roleLabel: "Função principal",
    favorites: [
      "Astra", "Breach", "Brimstone", "Chamber", "Clove", "Cypher", "Deadlock", "Fade", "Gekko", "Harbor",
      "Iso", "Jett", "KAY/O", "Killjoy", "Miks", "Neon", "Omen", "Phoenix", "Raze", "Reyna", "Sage",
      "Skye", "Sova", "Tejo", "Veto", "Viper", "Vyse", "Waylay", "Yoru",
    ],
    favoriteLabel: "Agente principal",
    rankScope: "platform",
    sourceUrls: [
      "https://support.riotgames.com/en-us/valorant/gameplay/valorant-competitive-mode-faq",
      "https://playvalorant.com/en-us/agents/",
    ],
  },
  {
    id: "league-of-legends",
    name: "League of Legends",
    platforms: ["PC"],
    rankLabel: "Rank da fila selecionada",
    rankOptions: [
      ...tiersWithFourDivisions(["Ferro", "Bronze", "Prata", "Ouro", "Platina", "Esmeralda", "Diamante"]),
      "Mestre", "Grão-mestre", "Desafiante",
    ],
    rankHelp: "Solo/Duo e Flex têm ranques independentes. Mestre, Grão-mestre e Desafiante não têm divisões.",
    modes: ["Solo/Duo", "Flex"],
    modeLabel: "Fila ranqueada",
    roles: ["Topo", "Selva", "Meio", "Atirador (Bot/ADC)", "Suporte"],
    roleLabel: "Rota principal",
    secondaryRoles: ["Topo", "Selva", "Meio", "Atirador (Bot/ADC)", "Suporte"],
    secondaryRoleLabel: "Rota secundária",
    rankResetOnModeChange: true,
    favorites: [],
    favoriteLabel: "Campeão principal",
    freeTextFavorite: true,
    sourceUrls: [
      "https://support.riotgames.com/en-us/league-of-legends/gameplay/ranked-tiers-divisions-and-queues",
      "https://support.riotgames.com/en-us/league-of-legends/gameplay/master-grandmaster-and-challenger-the-apex-tiers",
      "https://www.leagueoflegends.com/en-us/how-to-play/",
    ],
  },
  {
    id: "fortnite",
    name: "Fortnite",
    platforms: ["PC", "PlayStation", "Xbox", "Nintendo Switch", "Mobile"],
    rankLabel: "Rank",
    rankOptions: [
      ...tiersWithRomanDivisions(["Bronze", "Prata", "Ouro", "Platina", "Diamante", "Elite", "Campeão", "Unreal"]),
      "Unreal Legends",
    ],
    rankHelp: "Unreal Legends exige Unreal, 2.500+ Skill Rating e Top 500 no leaderboard; o status pode mudar.",
    modes: ["Battle Royale", "Zero Build", "Reload", "Reload Zero Build"],
    modeLabel: "Modo ranqueado preferido",
    roles: ["Fragger", "Construtor", "IGL / chamadas", "Suporte", "Flex"],
    roleLabel: "Papel de equipe (informal)",
    favorites: [],
    favoriteLabel: "Especialidade",
    rankModeGroups: [["Battle Royale", "Zero Build"]],
    note: "Battle Royale e Zero Build compartilham progresso. Comparações de rank com Reload/Reload Zero Build ficam limitadas ao mesmo modo para não cruzar escalas sem confirmação oficial.",
    sourceUrls: [
      "https://www.fortnite.com/competitive/rules-guidelines/rules-library/fortnite-ranked-cups-chapter-7-season-4-official-rules",
      "https://www.fortnite.com/competitive/discover-competitive/fortnite-ranked-play-explained",
      "https://www.fortnite.com/ranked/leaderboard",
    ],
  },
  {
    id: "counter-strike-2",
    name: "Counter-Strike 2",
    platforms: ["PC"],
    rankLabel: "Grupo competitivo por mapa",
    rankOptions: [
      "Silver I", "Silver II", "Silver III", "Silver IV", "Silver Elite", "Silver Elite Master",
      "Gold Nova I", "Gold Nova II", "Gold Nova III", "Gold Nova Master", "Master Guardian I",
      "Master Guardian II", "Master Guardian Elite", "Distinguished Master Guardian", "Legendary Eagle",
      "Legendary Eagle Master", "Supreme Master First Class", "Global Elite",
    ],
    rankHelp: "Competitivo tem um grupo por mapa. No Premier, informe o CS Rating numérico.",
    modes: ["Premier", "Competitivo (por mapa)"],
    modeLabel: "Fila ranqueada",
    roles: ["Entry fragger", "AWPer", "Support", "IGL", "Lurker", "Anchor"],
    roleLabel: "Função (informal)",
    favorites: [],
    favoriteLabel: "Mapa do grupo / preferido",
    freeTextFavorite: true,
    favoriteModes: ["Competitivo (por mapa)"],
    ratingMode: "Premier",
    ratingLabel: "CS Rating (Premier)",
    ratingHelp: "O CS Rating é um número do Premier, não um tier. Informe seu valor atual.",
    ratingMin: 0,
    ratingMax: 100000,
    ratingMatchRange: 5000,
    rankScope: "favorite",
    rankResetOnModeChange: true,
    sourceUrls: ["https://help.steampowered.com/en/faqs/view/3204-9FB1-967F-1AC6"],
  },
  {
    id: "apex-legends",
    name: "Apex Legends",
    platforms: ["PC", "PlayStation", "Xbox", "Nintendo Switch"],
    rankLabel: "Rank da Temporada",
    rankOptions: [
      ...tiersWithFourDivisions(["Iniciante", "Bronze", "Prata", "Ouro", "Platina", "Diamante"]),
      "Mestre", "Apex Predator",
    ],
    rankHelp: "Apex Predator é o Top 750 de Mestre por plataforma. Mudanças de rank anunciadas para Season 32 ainda são futuras.",
    modes: ["Ranked"],
    modeLabel: "Fila",
    roles: ["Assalto", "Escaramuça", "Reconhecimento", "Controlador", "Suporte"],
    roleLabel: "Classe da Lenda",
    favorites: [
      "Alter", "Ash", "Axle", "Ballistic", "Bangalore", "Bloodhound", "Catalyst", "Caustic", "Conduit", "Crypto",
      "Fuse", "Gibraltar", "Horizon", "Lifeline", "Loba", "Mad Maggie", "Mirage", "Newcastle", "Octane", "Pathfinder",
      "Rampart", "Revenant", "Seer", "Sparrow", "Valkyrie", "Vantage", "Wattson", "Wraith",
    ],
    favoriteLabel: "Lenda principal",
    rankScope: "platform",
    sourceUrls: [
      "https://help.ea.com/en/articles/apex-legends/ranked/",
      "https://www.ea.com/games/apex-legends/apex-legends/characters-hub",
      "https://www.ea.com/games/apex-legends/apex-legends/news/ranked-roadmap-31-32",
    ],
  },
]

export const findGame = (name: string) => GAME_CATALOG.find((game) => game.name === name)
export const findGameById = (id: string) => GAME_CATALOG.find((game) => game.id === id)
