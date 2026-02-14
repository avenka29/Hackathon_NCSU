import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import AppLayout from './components/AppLayout';
import PeoplePage from './pages/PeoplePage';
import PersonCallPage from './pages/PersonCallPage';
import BatchPage from './pages/BatchPage';
import MetricsPage from './pages/MetricsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route element={<AppLayout />}>
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/people/batch" element={<BatchPage />} />
          <Route path="/people/:personId" element={<PersonCallPage />} />
          <Route path="/metrics" element={<MetricsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
