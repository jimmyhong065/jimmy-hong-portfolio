import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { SiteSettingsProvider, useSiteSettings } from './contexts/SiteSettingsContext'
import ProtectedRoute from './components/ProtectedRoute'
import { initBotDetection } from './lib/botDetection'
import Home from './pages/Home'
// 非首頁路由 lazy：把 MarkdownContent / syntax-highlighter 等重依賴移出首屏 chunk
const Projects = lazy(() => import('./pages/Projects'))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const About = lazy(() => import('./pages/About'))
const Services = lazy(() => import('./pages/Services'))
const FAQ = lazy(() => import('./pages/FAQ'))
const Wish = lazy(() => import('./pages/Wish'))
const Saved = lazy(() => import('./pages/Saved'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Login = lazy(() => import('./pages/Login'))
const PhotoHome = lazy(() => import('./pages/photo/PhotoHome'))
const PhotoDetail = lazy(() => import('./pages/photo/PhotoDetail'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminPosts = lazy(() => import('./pages/admin/AdminPosts'))
const AdminTags = lazy(() => import('./pages/admin/AdminTags'))
const AdminPostEdit = lazy(() => import('./pages/admin/AdminPostEdit'))
const AdminProjects = lazy(() => import('./pages/admin/AdminProjects'))
const AdminProjectEdit = lazy(() => import('./pages/admin/AdminProjectEdit'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))
const AdminPhotoProjects = lazy(() => import('./pages/admin/AdminPhotoProjects'))
const AdminPhotoProjectEdit = lazy(() => import('./pages/admin/AdminPhotoProjectEdit'))
const AdminServices = lazy(() => import('./pages/admin/AdminServices'))
const AdminServiceEdit = lazy(() => import('./pages/admin/AdminServiceEdit'))
const AdminAnnouncements = lazy(() => import('./pages/admin/AdminAnnouncements'))
const AdminAnnouncementEdit = lazy(() => import('./pages/admin/AdminAnnouncementEdit'))
const AdminPhotos = lazy(() => import('./pages/admin/AdminPhotos'))
const AdminFAQs = lazy(() => import('./pages/admin/AdminFAQs'))
const AdminFAQEdit = lazy(() => import('./pages/admin/AdminFAQEdit'))
const AdminSubmissions = lazy(() => import('./pages/admin/AdminSubmissions'))
const AdminWishes = lazy(() => import('./pages/admin/AdminWishes'))
const AdminSubscribers = lazy(() => import('./pages/admin/AdminSubscribers'))
const AdminLinkedIn = lazy(() => import('./pages/admin/AdminLinkedIn'))
const Notifications = lazy(() => import('./pages/Notifications'))

function HiddenRoute({ pageKey, children }) {
  const { settings } = useSiteSettings()
  const hidden = settings.hidden_pages ?? []
  if (hidden.includes(pageKey)) return <Navigate to="/" replace />
  return children
}

function PushNavigationHandler() {
  const navigate = useNavigate()
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const handler = event => {
      if (event.data?.type === 'push-navigate') navigate(event.data.url)
    }
    navigator.serviceWorker.addEventListener('message', handler)
    return () => navigator.serviceWorker.removeEventListener('message', handler)
  }, [navigate])
  return null
}

// 手動送 GA4 page_view，排除 /admin 後台流量
function GAPageView() {
  const location = useLocation()
  useEffect(() => {
    if (typeof window.gtag !== 'function') return
    if (location.pathname.startsWith('/admin')) return
    // 延一個 tick，讓 Helmet 先更新 document.title
    const t = setTimeout(() => {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_location: window.location.href,
        page_title: document.title,
      })
    }, 0)
    return () => clearTimeout(t)
  }, [location.pathname, location.search])
  return null
}

// 一次性啟動真人/bot 偵測，後台 /admin 不計（自己人）
function BotDetection() {
  useEffect(() => {
    if (window.location.pathname.startsWith('/admin')) return
    return initBotDetection()
  }, [])
  return null
}

function AppRoutes() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<HiddenRoute pageKey="projects"><Projects /></HiddenRoute>} />
        <Route path="/projects/:id" element={<HiddenRoute pageKey="projects"><ProjectDetail /></HiddenRoute>} />
        <Route path="/blog" element={<HiddenRoute pageKey="blog"><Blog /></HiddenRoute>} />
        <Route path="/blog/:slug" element={<HiddenRoute pageKey="blog"><BlogPost /></HiddenRoute>} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/about" element={<HiddenRoute pageKey="about"><About /></HiddenRoute>} />
        <Route path="/services" element={<HiddenRoute pageKey="services"><Services /></HiddenRoute>} />
        <Route path="/faq" element={<HiddenRoute pageKey="faq"><FAQ /></HiddenRoute>} />
        <Route path="/wish" element={<HiddenRoute pageKey="wish"><Wish /></HiddenRoute>} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/login" element={<Login />} />
        <Route path="/photo" element={<HiddenRoute pageKey="photo"><PhotoHome /></HiddenRoute>} />
        <Route path="/photo/:id" element={<HiddenRoute pageKey="photo"><PhotoDetail /></HiddenRoute>} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/admin/posts" replace />} />
          <Route path="posts" element={<AdminPosts />} />
          <Route path="posts/:id" element={<AdminPostEdit />} />
          <Route path="tags" element={<AdminTags />} />
          <Route path="projects" element={<AdminProjects />} />
          <Route path="projects/:id" element={<AdminProjectEdit />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="photo-projects" element={<AdminPhotoProjects />} />
          <Route path="photo-projects/:id" element={<AdminPhotoProjectEdit />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="services/:id" element={<AdminServiceEdit />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="announcements/:id" element={<AdminAnnouncementEdit />} />
          <Route path="photos" element={<AdminPhotos />} />
          <Route path="faqs" element={<AdminFAQs />} />
          <Route path="faqs/:id" element={<AdminFAQEdit />} />
          <Route path="submissions" element={<AdminSubmissions />} />
          <Route path="wishes" element={<AdminWishes />} />
          <Route path="subscribers" element={<AdminSubscribers />} />
          <Route path="linkedin" element={<AdminLinkedIn />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <SiteSettingsProvider>
          <PushNavigationHandler />
          <GAPageView />
          <BotDetection />
          <AppRoutes />
        </SiteSettingsProvider>
      </BrowserRouter>
    </HelmetProvider>
  )
}
