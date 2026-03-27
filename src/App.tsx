import './App.css'
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom'

// import routes here
import PublicRoute from './routes/Public'
import PrivateRoute from './routes/Private'

// import Auth Pages
import Register from './pages/Auth/Register'
import Login from './pages/Auth/Login'

// Layout page
import Layout from './layout/Layout'

// import pages
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import { Toaster } from 'react-hot-toast'

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Default Route: Agar user "/" par aaye */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Public Routes: Only non-logged-in users can access these pages */}
          <Route element={<PublicRoute />}>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Private Routes: Only logged-in users can access these pages */}
          <Route element={<PrivateRoute />}>
            {/* Layout wrap karega in sab routes ko */}
            <Route element={<Layout><Outlet /></Layout>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/chat" element={<Chat />} />
            </Route>
          </Route>


        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" reverseOrder={false} />
    </>
  )
}

export default App
