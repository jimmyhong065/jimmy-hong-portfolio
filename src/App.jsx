import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route path="/projects" element={<div>Projects</div>} />
          <Route path="/projects/:id" element={<div>ProjectDetail</div>} />
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
