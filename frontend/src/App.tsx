import { Routes, Route } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import Layout from './components/Layout'
import GroupView from './pages/GroupView'
import NotFoundPage from './pages/NotFoundPage'

function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl font-semibold mb-4">Welcome to Evenly</h1>
      <p className="text-gray-600">Select a tab from the sidebar or create a new one to get started.</p>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/group/:id" element={<GroupView />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
