import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'traveltech-hub:reactions'

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}
  } catch {
    return {}
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // localStorage unavailable (e.g. private browsing) - reactions just won't persist.
  }
}

/**
 * Per-listing like/vote reactions, persisted to localStorage since there's no
 * backend yet. Future: swap the read/write here for a real API call keyed by
 * listing id, keeping the same { liked, vote, toggleLike, vote(dir) } shape.
 */
export function useReaction(listingId) {
  const [state, setState] = useState(() => readStore()[listingId] ?? { liked: false, vote: null })

  useEffect(() => {
    setState(readStore()[listingId] ?? { liked: false, vote: null })
  }, [listingId])

  const update = useCallback(
    (next) => {
      setState(next)
      const store = readStore()
      store[listingId] = next
      writeStore(store)
    },
    [listingId]
  )

  const toggleLike = useCallback(() => {
    update({ ...state, liked: !state.liked })
  }, [state, update])

  const castVote = useCallback(
    (direction) => {
      update({ ...state, vote: state.vote === direction ? null : direction })
    },
    [state, update]
  )

  return { liked: state.liked, vote: state.vote, toggleLike, castVote }
}
