import { Routes, Route, Navigate } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { BroadcastPage } from './pages/BroadcastPage'
import { WatchPage } from './pages/WatchPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/broadcast" element={<BroadcastPage />} />
      <Route path="/watch" element={<WatchPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
