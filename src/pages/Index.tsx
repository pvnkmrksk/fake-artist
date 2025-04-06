
import React from 'react'
import { Link } from 'react-router-dom'

export default function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-900 to-black text-white">
      <h1 className="mb-6 text-5xl font-bold">Sogu (ಸೋಗು)</h1>
      <p className="mb-8 text-xl">A social deduction drawing game where one player is the impostor</p>
      <Link to="/game" className="rounded bg-blue-600 px-6 py-3 text-lg font-semibold transition hover:bg-blue-700">
        Start Game
      </Link>
    </div>
  )
}
