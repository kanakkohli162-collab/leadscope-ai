import { useCallback, useEffect, useState } from 'react'
import { getLead, getLeads } from '@/services/leadService'

/** Loads all of the logged-in user's leads from the backend. */
export function useLeads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setLeads(await getLeads())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  return { leads, setLeads, loading, error, reload }
}

/** Loads one lead by id (for the Lead Details page). */
export function useLead(id) {
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    getLead(id)
      .then((l) => active && setLead(l))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [id])

  return { lead, setLead, loading, error }
}
