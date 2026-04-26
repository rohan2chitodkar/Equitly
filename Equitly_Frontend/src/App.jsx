import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Groups from './pages/Groups'
import GroupDetail from './pages/GroupDetail'
import Friends from './pages/Friends'
import Activity from './pages/Activity'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Register from './pages/Register'
import AllExpenses from './pages/AllExpenses'

function PrivateRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="groups" element={<Groups />} />
        <Route path="groups/:id" element={<GroupDetail />} />
        <Route path="friends" element={<Friends />} />
        <Route path="activity" element={<Activity />} />
        <Route path="settings" element={<Settings />} />
        <Route path="expenses" element={<AllExpenses />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
