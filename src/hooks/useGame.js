import { useState, useEffect } from 'react';
import { subscribeToGame, subscribeToScores } from '../firebase/gameService';
import { getCourseById } from '../data/courses';

export function useGame(code) {
  const [game, setGame] = useState(null);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!code) return;

    setLoading(true);
    setError(null);

    const unsubGame = subscribeToGame(code, (data) => {
      if (!data) {
        setError('Game not found');
        setLoading(false);
        return;
      }
      setGame(data);
      setLoading(false);
    });

    const unsubScores = subscribeToScores(code, (data) => {
      setScores(data);
    });

    return () => {
      unsubGame();
      unsubScores();
    };
  }, [code]);

  const course = game ? getCourseById(game.course.id) : null;

  return { game, scores, course, loading, error };
}
