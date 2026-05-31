import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
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
import Services from './pages/Services'

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
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
          </Route>
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  )
}
