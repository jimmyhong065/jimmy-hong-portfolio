import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import Home from './pages/Home'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/blog" element={<div>Blog</div>} />
          <Route path="/blog/:slug" element={<div>BlogPost</div>} />
          <Route path="/about" element={<div>About</div>} />
          <Route path="/login" element={<div>Login</div>} />
          <Route path="/admin/*" element={<div>Admin</div>} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  )
}
