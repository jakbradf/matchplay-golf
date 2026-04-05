import { CheckIcon } from './GolfIcon';

const STEPS = ['Course', 'Teams', 'Confirm', 'Share'];

export default function Stepper({ currentStep }) {
  return (
    <div className="stepper">
      {STEPS.map((label, idx) => {
        const stepNum = idx + 1;
        const isDone = stepNum < currentStep;
        const isActive = stepNum === currentStep;

        return (
          <div key={label} style={{ display: 'contents' }}>
            {idx > 0 && (
              <div className={`stepper-line${isDone || isActive ? ' done' : ''}`} />
            )}
            <div className={`stepper-step${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}>
              <div className="stepper-dot">
                {isDone ? <CheckIcon size={14} color="white" /> : stepNum}
              </div>
              <span className="stepper-label">{label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
