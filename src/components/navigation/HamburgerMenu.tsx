import { useState, useRef, useEffect } from 'react';
import { Menu, LogOut, TestTubeSolid, UserCircle, InfoCircle } from 'iconoir-react';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { AboutOverlay } from '../overlays/AboutOverlay';
import './HamburgerMenu.css';

interface HamburgerMenuProps {
  sdk: SpotifyApi;
  onTestbedClick: () => void;
  onMainAppClick?: () => void;
}

interface UserProfile {
  display_name: string;
  email?: string;
  images?: Array<{ url: string }>;
  followers?: { total: number };
}

export function HamburgerMenu({ sdk, onTestbedClick, onMainAppClick }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const logoSrc = `${import.meta.env.BASE_URL ?? '/'}images/logo.png`;

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await sdk.currentUser.profile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };

    if (sdk) {
      fetchUserProfile();
    }
  }, [sdk]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    try {
      sdk.logOut();
    } catch (error) {
      console.error('Failed to log out via Spotify SDK:', error);
    }

    // Clear any cached tokens and reload to restart auth flow
    localStorage.removeItem('spotify-sdk-access-token');
    localStorage.removeItem('spotify-sdk-refresh-token');
    localStorage.removeItem('spotify-sdk-verifier');
    window.location.reload();
  };

  const handleMenuNavigation = (callback?: () => void) => {
    if (callback) {
      callback();
    }
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const openAbout = () => {
    setShowAbout(true);
    setIsOpen(false);
  };

  return (
    <div className="hamburger-menu">
      <button
        ref={buttonRef}
        className="hamburger-button"
        onClick={toggleMenu}
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <img src={logoSrc} alt="Spotter logo" className="hamburger-logo" />
      </button>

      {isOpen && (
        <div ref={menuRef} className="hamburger-dropdown">
          {/* User Profile Section */}
          {userProfile && (
            <div className="user-profile-section">
              <div className="user-avatar">
                {userProfile.images && userProfile.images.length > 0 ? (
                  <img 
                    src={userProfile.images[0].url} 
                    alt="User avatar"
                    className="avatar-image"
                  />
                ) : (
                  <UserCircle className="avatar-fallback" />
                )}
              </div>
              <div className="user-info">
                <div className="user-name">
                  {userProfile.display_name || 'Spotify User'}
                </div>
                {userProfile.followers && (
                  <div className="user-stats">
                    {userProfile.followers.total} followers
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="menu-divider"></div>

          {/* Menu Items */}
          <div className="menu-items">
            {onMainAppClick && (
              <button 
                className="menu-item"
                onClick={() => handleMenuNavigation(onMainAppClick)}
              >
                <Menu className="menu-icon" />
                Main App
              </button>
            )}
            <button 
              className="menu-item testbed-item"
              onClick={() => handleMenuNavigation(onTestbedClick)}
            >
              <TestTubeSolid className="menu-icon" />
              Scary Testing Page
            </button>

            <button 
              className="menu-item"
              onClick={openAbout}
            >
              <InfoCircle className="menu-icon" />
              About Spotter
            </button>

            <button 
              className="menu-item logout-item"
              onClick={handleLogout}
            >
              <LogOut className="menu-icon" />
              Log Out
            </button>
          </div>
        </div>
      )}

      <AboutOverlay isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </div>
  );
}