import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, GolfFlagIcon } from './GolfIcon';

export default function Header({ title, showBack = false, backTo, rightElement }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="app-header">
      {showBack && (
        <button className="back-btn" onClick={handleBack} aria-label="Go back">
          <ChevronLeftIcon size={22} color="white" />
        </button>
      )}
      {!showBack && (
        <GolfFlagIcon size={22} color="white" />
      )}
      <h1>{title}</h1>
      {rightElement && <div>{rightElement}</div>}
    </header>
  );
}
