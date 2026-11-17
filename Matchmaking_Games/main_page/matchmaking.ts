export interface RankRules {
  rankOptions: string[]
  ratingMode?: string
  ratingMatchRange?: number
  rankScope?: "favorite" | "platform"
  rankSharedAcrossModes?: boolean
  rankModeGroups?: string[][]
}

export interface MatchProfile {
  game?: string
  mode?: string
  level?: string | number
  availability?: string
  role?: string
  favorite?: string
  style?: string
  platform?: string
}

const same = (left?: string | number, right?: string | number) => {
  if (left == null || right == null) return false
  const a = String(left).trim()
  const b = String(right).trim()
  return Boolean(a && b && a.toLocaleLowerCase() === b.toLocaleLowerCase())
}

function modesShareRank(left?: string, right?: string, rules?: RankRules) {
  if (!left || !right) return false
  if (left === right || rules?.rankSharedAcrossModes) return true
  return Boolean(rules?.rankModeGroups?.some((group) => group.includes(left) && group.includes(right)))
}

function rankSimilarity(left: MatchProfile, right: MatchProfile, rules: RankRules) {
  const ratingMatch = Boolean(rules.ratingMode && left.mode === rules.ratingMode && right.mode === rules.ratingMode)
  if (rules.rankScope === "favorite" && !ratingMatch && !same(left.favorite, right.favorite)) return 0
  if (rules.rankScope === "platform" && !same(left.platform, right.platform)) return 0

  if (rules.ratingMode && left.mode === rules.ratingMode && right.mode === rules.ratingMode) {
    const leftRating = Number(left.level)
    const rightRating = Number(right.level)
    if (!Number.isFinite(leftRating) || !Number.isFinite(rightRating)) return 0
    const range = Math.max(1, rules.ratingMatchRange ?? 5000)
    return Math.max(0, 1 - Math.abs(leftRating - rightRating) / range)
  }

  if (!modesShareRank(left.mode, right.mode, rules)) return 0
  const leftIndex = rules.rankOptions.indexOf(String(left.level ?? ""))
  const rightIndex = rules.rankOptions.indexOf(String(right.level ?? ""))
  if (leftIndex < 0 || rightIndex < 0) return 0
  const maximumDistance = Math.max(1, rules.rankOptions.length - 1)
  return Math.max(0, 1 - Math.abs(leftIndex - rightIndex) / maximumDistance)
}

/** Deterministic score capped at 100; rank scales never cross game boundaries. */
export function calculateCompatibility(current: MatchProfile, candidate: MatchProfile, rules: RankRules): number {
  let score = 0
  const sameGame = same(current.game, candidate.game)

  if (sameGame) {
    score += 20
    const sameMode = same(current.mode, candidate.mode)
    if (sameMode) score += 10
    if (modesShareRank(current.mode, candidate.mode, rules)) {
      score += 25 * rankSimilarity(current, candidate, rules)
    }
  }

  if (same(current.availability, candidate.availability)) score += 20
  else if (current.availability && candidate.availability && (current.availability === "Horários variados" || candidate.availability === "Horários variados")) score += 10

  if (same(current.role, candidate.role)) score += 10
  if (same(current.favorite, candidate.favorite)) score += 3
  if (same(current.style, candidate.style)) score += 2
  if (same(current.platform, candidate.platform)) score += 10

  return Math.max(0, Math.min(100, Math.round(score)))
}
