import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import Login from './pages/Login';
import EditReport from './pages/EditReport';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/edit-report" element={<EditReport />} />
      </Routes>
    </Router>
  );
}

export default App;
