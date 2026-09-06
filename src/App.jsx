import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import CreateGame from './pages/CreateGame';
import JoinGame from './pages/JoinGame';
import GameView from './pages/GameView';
import Results from './pages/Results';
import WatchGame from './pages/WatchGame';
import MyGames from './pages/MyGames';
import CreateCourse from './pages/CreateCourse';
import CreateTournament from './pages/CreateTournament';
import JoinTournament from './pages/JoinTournament';
import TournamentView from './pages/TournamentView';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateGame />} />
          <Route path="/join" element={<JoinGame />} />
          <Route path="/game/:code" element={<GameView />} />
          <Route path="/game/:code/results" element={<Results />} />
          <Route path="/game/:code/watch" element={<WatchGame />} />
          <Route path="/my-games" element={<MyGames />} />
          <Route path="/create-course" element={<CreateCourse />} />
          <Route path="/create-tournament" element={<CreateTournament />} />
          <Route path="/join-tournament" element={<JoinTournament />} />
          <Route path="/tournament/:code" element={<TournamentView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
