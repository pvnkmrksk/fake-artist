
import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-900 to-black text-white">
      <h1 className="mb-6 text-5xl font-bold">404</h1>
      <p className="mb-8 text-xl">Page Not Found</p>
      <Link to="/" className="rounded bg-blue-600 px-6 py-2 text-lg transition hover:bg-blue-700">
        Go Home
      </Link>
    </div>
  )
}
