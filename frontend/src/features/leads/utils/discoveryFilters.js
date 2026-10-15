/** Find Leads helpers: client-side filter / sort of search results. */

export const DEFAULT_FILTERS = { priority: '', website: 'any', phone: 'any', minScore: 0 }
export const SORTS = [
  { value: 'fit', label: 'Best fit for my service', needsService: true },
  { value: 'score', label: 'Score (highest first)' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'gaps', label: 'Most gaps' },
]

/**
 * Applies the filters + sort to the current search results (all in the browser, no new search).
 * `fitRank(result)` (from the chosen "What do you sell?" service) is used by the "fit" sort.
 */
export function applyFilters(results, filters, sort, fitRank) {
  const list = results.filter((r) =>
    (!filters.priority || r.priority === filters.priority) &&
    (filters.website === 'any' || (filters.website === 'yes' ? r.hasWebsite : !r.hasWebsite)) &&
    (filters.phone === 'any' || (filters.phone === 'yes' ? Boolean(r.raw?.phone) : !r.raw?.phone)) &&
    r.score >= filters.minScore)
  if (sort === 'name') return [...list].sort((a, b) => a.name.localeCompare(b.name))
  if (sort === 'gaps') return [...list].sort((a, b) => b.serviceGaps.length - a.serviceGaps.length || b.score - a.score)
  if (sort === 'fit' && fitRank) return [...list].sort((a, b) => fitRank(b) - fitRank(a) || b.score - a.score)
  return [...list].sort((a, b) => b.score - a.score)
}
