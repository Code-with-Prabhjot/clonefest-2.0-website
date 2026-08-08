import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPortal from './pages/MainPortal';
import AdminPortal from './pages/AdminPortal';
import JudgePortal from './pages/JudgePortal';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPortal />} />
        <Route path="/admin" element={<AdminPortal />} />
        <Route path="/judge" element={<JudgePortal />} />
      </Routes>
    </Router>
  );
}

export default App;
