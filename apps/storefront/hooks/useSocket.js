'use client'

import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'

export function useSocket() {
  const [connected, setConnected] = useState(false)
  const [orderStatus, setOrderStatus] = useState(null)

  useEffect(() => {
    const socket = io('http://localhost:4003')

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('join_storefront')
    })

    socket.on('disconnect', () => {
      setConnected(false)
    })

    socket.on('order_completed', (data) => {
      setOrderStatus(`Order completed: ${data.orderId}`)
      setTimeout(() => setOrderStatus(null), 5000)
    })

    socket.on('order_failed', (data) => {
      setOrderStatus(`Order failed: ${data.error}`)
      setTimeout(() => setOrderStatus(null), 5000)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  return { connected, orderStatus }
}
