
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Make sure the DOM is loaded before we try to use it
const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
