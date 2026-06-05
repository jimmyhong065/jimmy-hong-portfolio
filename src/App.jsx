import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import About from './pages/About'
import Services from './pages/Services'
import FAQ from './pages/FAQ'
import Saved from './pages/Saved'
import NotFound from './pages/NotFound'
const Login = lazy(() => import('./pages/Login'))
const PhotoHome = lazy(() => import('./pages/photo/PhotoHome'))
const PhotoDetail = lazy(() => import('./pages/photo/PhotoDetail'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminPosts = lazy(() => import('./pages/admin/AdminPosts'))
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
const AdminSubscribers = lazy(() => import('./pages/admin/AdminSubscribers'))
const Notifications = lazy(() => import('./pages/Notifications'))

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

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <PushNavigationHandler />
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/login" element={<Login />} />
            <Route path="/photo" element={<PhotoHome />} />
            <Route path="/photo/:id" element={<PhotoDetail />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/admin/posts" replace />} />
              <Route path="posts" element={<AdminPosts />} />
              <Route path="posts/:id" element={<AdminPostEdit />} />
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
              <Route path="subscribers" element={<AdminSubscribers />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </HelmetProvider>
  )
}
