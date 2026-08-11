import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import AdminPortal from './pages/AdminPortal';
import JudgePortal from './pages/JudgePortal';
import AuthPage from './pages/AuthPage';
import Leaderboard from './pages/Leaderboard';
import HackerPortal from './pages/HackerPortal';
import TeamDetails from './pages/TeamDetails';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AdminPreview, JudgePreview } from './pages/PortalPreview';
import HackerPet from './components/HackerPet';
import CustomCursor from './components/CustomCursor';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/portal" element={<ProtectedRoute><HackerPortal /></ProtectedRoute>} />
        <Route path="/portal/team" element={<ProtectedRoute><TeamDetails /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPortal /></ProtectedRoute>} />
        <Route path="/judge" element={<ProtectedRoute allowedRoles={['judge', 'admin']}><JudgePortal /></ProtectedRoute>} />

        {/* Unguarded design preview, stripped from production builds. */}
        {import.meta.env.DEV && (
          <>
            <Route path="/preview/admin" element={<AdminPreview />} />
            <Route path="/preview/judge" element={<JudgePreview />} />
          </>
        )}
      </Routes>

      {/* Mounted once, outside Routes, so it walks across every screen
          without restarting on navigation. */}
      <HackerPet />
      <CustomCursor />
    </Router>
  );
}

export default App;
