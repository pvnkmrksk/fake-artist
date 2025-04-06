
import React from 'react'
import { Link } from 'react-router-dom'

export default function Game() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-900 to-black text-white">
      <h1 className="mb-6 text-4xl font-bold">Game Room</h1>
      <p className="mb-8">Game interface will be implemented here</p>
      <Link to="/" className="rounded bg-blue-600 px-6 py-2 text-lg transition hover:bg-blue-700">
        Back to Home
      </Link>
    </div>
  )
}
