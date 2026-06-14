import { useState, useCallback } from 'react'

export function useModal(initialState = null) {
  const [modal, setModal] = useState(initialState)

  const open  = useCallback(data => setModal(data ?? true), [])
  const close = useCallback(() => setModal(null), [])
  const toggle = useCallback(() => setModal(prev => prev ? null : true), [])

  return { modal, open, close, toggle, isOpen: modal !== null }
}
