import { useState, useEffect } from 'react';
import { subscribeToTournament, subscribeToTournamentScores } from '../firebase/tournamentService';
import { getCourseById } from '../data/courses';

export function useTournament(code) {
  const [tournament, setTournament] = useState(null);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!code) return;

    setLoading(true);
    setError(null);

    const unsubTournament = subscribeToTournament(code, (data) => {
      if (!data) {
        setError('Tournament not found');
        setLoading(false);
        return;
      }
      setTournament(data);
      setLoading(false);
    });

    const unsubScores = subscribeToTournamentScores(code, (data) => {
      setScores(data);
    });

    return () => {
      unsubTournament();
      unsubScores();
    };
  }, [code]);

  const course = tournament ? getCourseById(tournament.course.id) : null;

  return { tournament, scores, course, loading, error };
}
