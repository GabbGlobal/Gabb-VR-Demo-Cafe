import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useUserStore } from './store/userStore'

// Pages
import LandingPage from './pages/Landing'
import WelcomePage from './pages/onboarding/Welcome'
import LanguageSelectPage from './pages/onboarding/LanguageSelect'
import InterestSelectPage from './pages/onboarding/InterestSelect'
import PersonalizePage from './pages/onboarding/Personalize'
import BiosensorSetupPage from './pages/onboarding/BiosensorSetup'
import DashboardPage from './pages/Dashboard'
import LessonPage from './pages/Lesson'
import ProgressPage from './pages/Progress'
import SubscriptionPage from './pages/Subscription'
import LeaderboardPage from './pages/Leaderboard'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isOnboarded = useUserStore(s => s.isOnboarded)
  return isOnboarded ? <>{children}</> : <Navigate to="/" replace />
}

export default function App() {
  const isOnboarded = useUserStore(s => s.isOnboarded)

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={isOnboarded ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        <Route path="/subscribe" element={<SubscriptionPage />} />

        {/* Onboarding */}
        <Route path="/onboarding/welcome"   element={<WelcomePage />} />
        <Route path="/onboarding/language"  element={<LanguageSelectPage />} />
        <Route path="/onboarding/interests" element={<InterestSelectPage />} />
        <Route path="/onboarding/personalize" element={<PersonalizePage />} />
        <Route path="/onboarding/biosensor" element={<BiosensorSetupPage />} />

        {/* App */}
        <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path="/lesson/:category" element={<RequireAuth><LessonPage /></RequireAuth>} />
        <Route path="/progress"     element={<RequireAuth><ProgressPage /></RequireAuth>} />
        <Route path="/leaderboard"  element={<RequireAuth><LeaderboardPage /></RequireAuth>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
