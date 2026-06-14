import { useState, useMemo } from 'react'
import { useDebounce } from './useDebounce'

export function useSearch(items, fields) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 200)

  const filtered = useMemo(() => {
    if (!debouncedQuery.trim()) return items
    const q = debouncedQuery.toLowerCase()
    return items.filter(item =>
      fields.some(field => {
        const val = item[field]
        return val && String(val).toLowerCase().includes(q)
      })
    )
  }, [items, debouncedQuery, fields])

  return { query, setQuery, filtered }
}
