import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Groups from './pages/Groups'
import GroupDetail from './pages/GroupDetail'
import Friends from './pages/Friends'
import Activity from './pages/Activity'
import AllExpenses from './pages/AllExpenses'
import Settings from './pages/Settings'
import { useAuth } from './context/AuthContext'

function PrivateRoute({ children }) {
    const { token } = useAuth()
    return token ? children : <Navigate to="/login" />
}

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register"
                element={<Register />} />
            <Route path="/" element={
                <PrivateRoute>
                    <Layout />
                </PrivateRoute>
            }>
                <Route index
                    element={<Dashboard />} />
                <Route path="groups"
                    element={<Groups />} />
                <Route path="groups/:id"
                    element={<GroupDetail />} />
                <Route path="friends"
                    element={<Friends />} />
                {/* ── New route for individual friend ── */}
                <Route path="friends/:personId"
                    element={<Friends />} />
                <Route path="activity"
                    element={<Activity />} />
                <Route path="expenses"
                    element={<AllExpenses />} />
                <Route path="settings"
                    element={<Settings />} />
            </Route>
        </Routes>
    )
}