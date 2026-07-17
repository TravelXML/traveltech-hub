import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import Home from './pages/Home.jsx'
import CategoryPage from './pages/CategoryPage.jsx'
import AddBusiness from './pages/AddBusiness.jsx'
import AddNews from './pages/AddNews.jsx'
import AddEvent from './pages/AddEvent.jsx'
import AddJob from './pages/AddJob.jsx'
import Contact from './pages/Contact.jsx'
import NewsPage from './pages/NewsPage.jsx'
import EventsPage from './pages/EventsPage.jsx'
import JobsPage from './pages/JobsPage.jsx'
import JobDetail from './pages/JobDetail.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import ListingDetail from './pages/ListingDetail.jsx'
import Dashboard from './pages/Dashboard.jsx'
import MyListings from './pages/MyListings.jsx'
import EditListing from './pages/EditListing.jsx'
import MyNews from './pages/MyNews.jsx'
import EditNews from './pages/EditNews.jsx'
import MyEvents from './pages/MyEvents.jsx'
import EditEvent from './pages/EditEvent.jsx'
import MyJobs from './pages/MyJobs.jsx'
import EditJob from './pages/EditJob.jsx'
import JobApplicants from './pages/JobApplicants.jsx'
import MyApplications from './pages/MyApplications.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminListings from './pages/AdminListings.jsx'
import AdminListingDetail from './pages/AdminListingDetail.jsx'
import AdminNews from './pages/AdminNews.jsx'
import AdminNewsDetail from './pages/AdminNewsDetail.jsx'
import AdminEvents from './pages/AdminEvents.jsx'
import AdminEventsDetail from './pages/AdminEventsDetail.jsx'
import AdminJobs from './pages/AdminJobs.jsx'
import AdminJobDetail from './pages/AdminJobDetail.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add-business" element={<AddBusiness />} />
          <Route path="/add-news" element={<AddNews />} />
          <Route path="/add-event" element={<AddEvent />} />
          <Route path="/add-job" element={<AddJob />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/contact" element={<Contact />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/vendor/:slug" element={<ListingDetail />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/listings"
            element={
              <ProtectedRoute>
                <MyListings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/listings/:id/edit"
            element={
              <ProtectedRoute>
                <EditListing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/news"
            element={
              <ProtectedRoute>
                <MyNews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/news/:id/edit"
            element={
              <ProtectedRoute>
                <EditNews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/events"
            element={
              <ProtectedRoute>
                <MyEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/events/:id/edit"
            element={
              <ProtectedRoute>
                <EditEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/jobs"
            element={
              <ProtectedRoute>
                <MyJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/jobs/:id/edit"
            element={
              <ProtectedRoute>
                <EditJob />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/jobs/:id/applicants"
            element={
              <ProtectedRoute>
                <JobApplicants />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/applications"
            element={
              <ProtectedRoute>
                <MyApplications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/listings"
            element={
              <AdminRoute>
                <AdminListings />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/listings/:id"
            element={
              <AdminRoute>
                <AdminListingDetail />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/news"
            element={
              <AdminRoute>
                <AdminNews />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/news/:id"
            element={
              <AdminRoute>
                <AdminNewsDetail />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <AdminRoute>
                <AdminEvents />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/events/:id"
            element={
              <AdminRoute>
                <AdminEventsDetail />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/jobs"
            element={
              <AdminRoute>
                <AdminJobs />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/jobs/:id"
            element={
              <AdminRoute>
                <AdminJobDetail />
              </AdminRoute>
            }
          />

          {/* Every category route is a single path segment matching its
              config id (e.g. /pms, /hotel-aggregators), so one dynamic
              route handles every category in src/config/categories.js.
              It must stay after every other named route above so those
              aren't swallowed by this catch-all. */}
          <Route path="/:categoryId" element={<CategoryPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
