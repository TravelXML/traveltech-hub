import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import ConfigGuard from './components/ConfigGuard.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'

// import.meta.env.BASE_URL always has a trailing slash (Vite guarantees
// this); React Router's basename expects no trailing slash except for '/'.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigGuard>
      <BrowserRouter basename={basename}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ConfigGuard>
  </React.StrictMode>
)
