import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import CategoryPage from './pages/CategoryPage.jsx'
import AddBusiness from './pages/AddBusiness.jsx'
import NewsPage from './pages/NewsPage.jsx'
import EventsPage from './pages/EventsPage.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add-business" element={<AddBusiness />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/events" element={<EventsPage />} />
          {/* Every category route is a single path segment matching its
              config id (e.g. /pms, /hotel-aggregators), so one dynamic
              route handles every category in src/config/categories.js. */}
          <Route path="/:categoryId" element={<CategoryPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
