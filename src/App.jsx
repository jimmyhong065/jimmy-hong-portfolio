import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'

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
import Home from './pages/Home'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import About from './pages/About'
import Login from './pages/Login'
import PhotoHome from './pages/photo/PhotoHome'
import PhotoDetail from './pages/photo/PhotoDetail'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './pages/admin/AdminLayout'
import AdminPosts from './pages/admin/AdminPosts'
import AdminPostEdit from './pages/admin/AdminPostEdit'
import AdminProjects from './pages/admin/AdminProjects'
import AdminProjectEdit from './pages/admin/AdminProjectEdit'
import AdminSettings from './pages/admin/AdminSettings'
import AdminPhotoProjects from './pages/admin/AdminPhotoProjects'
import AdminPhotoProjectEdit from './pages/admin/AdminPhotoProjectEdit'
import AdminServices from './pages/admin/AdminServices'
import AdminServiceEdit from './pages/admin/AdminServiceEdit'
import AdminAnnouncements from './pages/admin/AdminAnnouncements'
import AdminAnnouncementEdit from './pages/admin/AdminAnnouncementEdit'
import AdminPhotos from './pages/admin/AdminPhotos'
import AdminFAQs from './pages/admin/AdminFAQs'
import AdminFAQEdit from './pages/admin/AdminFAQEdit'
import AdminSubmissions from './pages/admin/AdminSubmissions'
import AdminSubscribers from './pages/admin/AdminSubscribers'
import Services from './pages/Services'
import FAQ from './pages/FAQ'
import Saved from './pages/Saved'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <PushNavigationHandler />
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
      </BrowserRouter>
    </HelmetProvider>
  )
}
