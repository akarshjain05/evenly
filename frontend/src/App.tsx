import { Routes, Route } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import Layout from './components/Layout'

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
        {/* We will add GroupView and other routes here later */}
      </Route>
    </Routes>
  )
}

export default App
