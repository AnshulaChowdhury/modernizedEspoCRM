import { useLocation } from 'react-router-dom';

interface BetaBannerProps {
  /** Base path to the classic/Backbone frontend (default: /classic) */
  classicBasePath?: string;
}

export function BetaBanner({ classicBasePath = '/classic' }: BetaBannerProps): React.ReactElement {
  const location = useLocation();

  // Convert React route to Backbone hash route
  // React uses /Account/view/123, Backbone uses /classic/#Account/view/123
  const currentPath = location.pathname === '/' ? '' : location.pathname;
  const hashPath = currentPath.startsWith('/') ? currentPath.slice(1) : currentPath;
  const classicUrl = `${classicBasePath}/#${hashPath}`;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
        color: 'white',
        textAlign: 'center',
        padding: '8px 16px',
        fontSize: '14px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      }}
    >
      <span style={{ fontWeight: 500 }}>
        🚀 Our new frontend is in Beta.
      </span>
      <a
        href={classicUrl}
        style={{
          color: 'white',
          textDecoration: 'underline',
          fontWeight: 600,
        }}
      >
        Switch to Classic View
      </a>
    </div>
  );
}

/** @deprecated Use BetaBanner instead */
export function DevBanner(): React.ReactElement | null {
  // Only show in development or when VITE_SHOW_DEV_BANNER=true
  if (import.meta.env.PROD && !import.meta.env.VITE_SHOW_DEV_BANNER) {
    return null;
  }

  return <BetaBanner />;
}
