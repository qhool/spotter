import { Refresh } from 'iconoir-react';

interface RemixControlsProps {
  trackCount: number;
  remixMethod: string;
  methodOptions: string[];
  onMethodChange: (value: string) => void;
  onRefresh: () => void | Promise<void>;
  className?: string;
  buttonClassName?: string;
  label?: string;
  hidden?: boolean;
  disabled?: boolean;
  showMethod?: boolean;
}

export function RemixControls({
  trackCount,
  remixMethod,
  methodOptions,
  onMethodChange,
  onRefresh,
  className,
  buttonClassName,
  label,
  hidden = false,
  disabled = false,
  showMethod = true
}: RemixControlsProps) {
  const countLabel = label ?? `${trackCount} Tracks`;
  return (
    <div
      className={['remix-controls', className, hidden && 'is-hidden'].filter(Boolean).join(' ')}
      aria-hidden={hidden}
    >
      {showMethod && (
        <div className="track-list-pane__method-group">
          <label htmlFor="remix-method" className="control-label">
            Remix Method
          </label>
          <select
            id="remix-method"
            className="control-select"
            value={remixMethod}
            onChange={e => onMethodChange(e.target.value)}
          >
            {methodOptions.map(option => (
              <option key={option} value={option}>
                {option === 'shuffle' ? 'Shuffle' : 'Concatenate'}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="button"
        className={['track-list-pane__refresh-button', buttonClassName].filter(Boolean).join(' ')}
        onClick={onRefresh}
        aria-label="Refresh remix"
        disabled={disabled || hidden}
      >
        <Refresh className="refresh-icon" />
        {countLabel}
      </button>
    </div>
  );
}
