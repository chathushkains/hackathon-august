'use client'

import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'

export function useSocket() {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const socket = io('http://localhost:4003')

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('join_admin')
    })

    socket.on('disconnect', () => {
      setConnected(false)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  return { connected }
}
