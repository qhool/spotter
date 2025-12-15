import { CSSProperties } from 'react';
import './LoadingAnimation.css';

interface LoadingAnimationProps {
  /** Optional descriptive label shown beneath the animation */
  label?: string;
  /** Additional class names for layout overrides */
  className?: string;
  /** Desired width of the animation (number interpreted as pixels). */
  width?: number | string;
}

type LoadingAnimationStyle = CSSProperties & {
  ['--loading-animation-width']?: string;
};

export function LoadingAnimation({ label = 'Loading…', className, width }: LoadingAnimationProps) {
  const classes = ['loading-animation', className].filter(Boolean).join(' ');
  const style: LoadingAnimationStyle = {};

  if (width !== undefined) {
    style['--loading-animation-width'] = typeof width === 'number' ? `${width}px` : width;
  }

  return (
    <div className={classes} role="status" aria-live="polite" style={style}>
      <div className="loading-animation-frame" aria-hidden="true">
        <div className="loading-animation-inner">
          <picture>
            <source srcSet="/media/loading.webp" type="image/webp" />
            <img
              src="/media/loading.gif"
              alt=""
              className="loading-animation-media"
              loading="lazy"
              decoding="async"
            />
          </picture>
        </div>
      </div>
      {label && <div className="loading-animation-label">{label}</div>}
    </div>
  );
}
