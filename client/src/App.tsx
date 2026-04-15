import { Routes, Route, Navigate } from 'react-router-dom'
import { UserProfileProvider } from './context/UserProfileContext'
import { LandingPage } from './pages/LandingPage'
import { BroadcastPage } from './pages/BroadcastPage'
import { WatchPage } from './pages/WatchPage'

export default function App() {
  return (
    <UserProfileProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/broadcast" element={<BroadcastPage />} />
        <Route path="/watch/:username" element={<WatchPage />} />
        <Route path="/watch" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </UserProfileProvider>
  )
}
