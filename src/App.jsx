import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPortal from './pages/MainPortal';
import AdminPortal from './pages/AdminPortal';
import JudgePortal from './pages/JudgePortal';
import AuthPage from './pages/AuthPage';
import HackerPortal from './pages/HackerPortal';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPortal />} />
        <Route path="/admin" element={<ProtectedRoute><AdminPortal /></ProtectedRoute>} />
        <Route path="/judge" element={<ProtectedRoute><JudgePortal /></ProtectedRoute>} />
        <Route path="/portal" element={<ProtectedRoute><HackerPortal /></ProtectedRoute>} />
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </Router>
  );
}

export default App;
