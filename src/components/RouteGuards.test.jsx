import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute.jsx'
import AdminRoute from './AdminRoute.jsx'

const mockUseAuth = vi.fn()
vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => mockUseAuth(),
}))

function renderWithRoute(Guard) {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/" element={<div>Home page</div>} />
        <Route
          path="/protected"
          element={
            <Guard>
              <div>Secret content</div>
            </Guard>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  it('shows a loading state while auth is resolving', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true })
    renderWithRoute(ProtectedRoute)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('redirects to /login when logged out', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false })
    renderWithRoute(ProtectedRoute)
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('renders children when logged in', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' }, loading: false })
    renderWithRoute(ProtectedRoute)
    expect(screen.getByText('Secret content')).toBeInTheDocument()
  })
})

describe('AdminRoute', () => {
  it('redirects to /login when logged out', () => {
    mockUseAuth.mockReturnValue({ user: null, isAdmin: false, loading: false })
    renderWithRoute(AdminRoute)
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('redirects to / when logged in but not an admin', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' }, isAdmin: false, loading: false })
    renderWithRoute(AdminRoute)
    expect(screen.getByText('Home page')).toBeInTheDocument()
  })

  it('renders children when logged in as an admin', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' }, isAdmin: true, loading: false })
    renderWithRoute(AdminRoute)
    expect(screen.getByText('Secret content')).toBeInTheDocument()
  })
})
