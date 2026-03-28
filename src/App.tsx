import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useUserStore } from './store/userStore'

// Pages
import LandingPage from './pages/Landing'
import WelcomePage from './pages/onboarding/Welcome'
import LanguageSelectPage from './pages/onboarding/LanguageSelect'
import InterestSelectPage from './pages/onboarding/InterestSelect'
import PersonalizePage from './pages/onboarding/Personalize'
import BiosensorSetupPage from './pages/onboarding/BiosensorSetup'
import GoalPage from './pages/onboarding/Goal'
import TimeCommitPage from './pages/onboarding/TimeCommit'
import PlacementPage from './pages/onboarding/Placement'
import CourseLoadingPage from './pages/onboarding/CourseLoading'
import DashboardPage from './pages/Dashboard'
import LessonPage from './pages/Lesson'
import ProgressPage from './pages/Progress'
import SubscriptionPage from './pages/Subscription'
import LeaderboardPage from './pages/Leaderboard'
import WordMatchPage from './pages/games/WordMatch'
import CafeItalianoPage from './pages/games/CafeItaliano'
import AITutorPage from './pages/AITutor'
import RichPlaylistPage from './pages/RichPlaylist'
import VRPracticePage from './pages/VRPractice'
import CaffeRomaPage from './pages/games/CaffeRoma'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useUserStore(s => s.isLoggedIn)
  return isLoggedIn ? <>{children}</> : <Navigate to="/" replace />
}

/** Prevents already-logged-in users from re-entering onboarding */
function RequireNotAuth({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useUserStore(s => s.isLoggedIn)
  return isLoggedIn ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

export default function App() {
  const isLoggedIn = useUserStore(s => s.isLoggedIn)

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        <Route path="/subscribe" element={<SubscriptionPage />} />

        {/* Onboarding — locked out once onboarded (go to Settings to re-do) */}
        <Route path="/onboarding/welcome"      element={<RequireNotAuth><WelcomePage /></RequireNotAuth>} />
        <Route path="/onboarding/language"     element={<RequireNotAuth><LanguageSelectPage /></RequireNotAuth>} />
        <Route path="/onboarding/interests"    element={<RequireNotAuth><InterestSelectPage /></RequireNotAuth>} />
        <Route path="/onboarding/personalize"  element={<RequireNotAuth><PersonalizePage /></RequireNotAuth>} />
        <Route path="/onboarding/biosensor"    element={<RequireNotAuth><BiosensorSetupPage /></RequireNotAuth>} />
        <Route path="/onboarding/goal"         element={<RequireNotAuth><GoalPage /></RequireNotAuth>} />
        <Route path="/onboarding/time-commit"  element={<RequireNotAuth><TimeCommitPage /></RequireNotAuth>} />
        <Route path="/onboarding/placement"    element={<RequireNotAuth><PlacementPage /></RequireNotAuth>} />
        <Route path="/onboarding/course-loading" element={<RequireNotAuth><CourseLoadingPage /></RequireNotAuth>} />

        {/* App */}
        <Route path="/dashboard"   element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path="/lesson/:category" element={<RequireAuth><LessonPage /></RequireAuth>} />
        <Route path="/progress"    element={<RequireAuth><ProgressPage /></RequireAuth>} />
        <Route path="/leaderboard" element={<RequireAuth><LeaderboardPage /></RequireAuth>} />
        <Route path="/tutor"       element={<RequireAuth><AITutorPage /></RequireAuth>} />

        {/* Games */}
        <Route path="/games/word-match"    element={<RequireAuth><WordMatchPage /></RequireAuth>} />
        <Route path="/games/cafe-italiano" element={<RequireAuth><CafeItalianoPage /></RequireAuth>} />
        <Route path="/games/caffe-roma"    element={<RequireAuth><CaffeRomaPage /></RequireAuth>} />
        <Route path="/rich"                element={<RequireAuth><RichPlaylistPage /></RequireAuth>} />
        <Route path="/vr-practice"         element={<RequireAuth><VRPracticePage /></RequireAuth>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
