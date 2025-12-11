import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { useState, useEffect, useMemo } from 'react';
import { TrackList } from '../components/TrackList';
import { RecentTracksContainer } from '../data/TrackContainer';
import { SlideNav } from '../components/SlideNav';
import { ArrowLeft } from 'iconoir-react';
import { Wizard, WizardPane, WizardPaneRenderContext, WizardViewTitles } from '../components/Wizard';

interface TestbedPageProps {
  sdk: SpotifyApi;
  onBackToApp?: () => void;
}

export function TestbedPage({ sdk, onBackToApp }: TestbedPageProps) {
  const [recentTracksContainer, setRecentTracksContainer] = useState<RecentTracksContainer | null>(null);
  const [selectedNavIndex, setSelectedNavIndex] = useState(0);
  const [demoWindowSize, setDemoWindowSize] = useState(1);
  const baseViewTitles = useMemo<WizardViewTitles>(
    () => ({
      1: ['Select Items', 'Remix', 'Export'],
      2: ['Select + Remix', 'Remix + Export'],
      3: ['Production Flow']
    }),
    []
  );

  const wizardViewTitles = useMemo<WizardViewTitles>(() => {
    const titles: WizardViewTitles = {};
    if (baseViewTitles[1]) {
      titles[1] = baseViewTitles[1];
    }
    if (demoWindowSize >= 2 && baseViewTitles[2]) {
      titles[2] = baseViewTitles[2];
    }
    if (demoWindowSize >= 3 && baseViewTitles[3]) {
      titles[3] = baseViewTitles[3];
    }
    return titles;
  }, [baseViewTitles, demoWindowSize]);
  const wizardPanes = useMemo<WizardPane[]>(
    () => [
      {
        id: 'select-items',
        title: 'Select Items',
        render: context => (
          <WizardDemoPane
            heading="Select Items"
            description="Pick playlists or artists to use as inputs."
            context={context}
          />
        )
      },
      {
        id: 'remix',
        title: 'Remix',
        render: context => (
          <WizardDemoPane
            heading="Remix"
            description="Blend tracks, adjust order, and audition transitions."
            context={context}
          />
        )
      },
      {
        id: 'export',
        title: 'Export',
        render: context => (
          <WizardDemoPane
            heading="Export"
            description="Send finished playlists back to Spotify or share externally."
            context={context}
          />
        )
      }
    ],
    []
  );

  // Create the recent tracks container when sdk is available
  useEffect(() => {
    if (sdk) {
      setRecentTracksContainer(new RecentTracksContainer(sdk));
    }
  }, [sdk]);

  // Test navigation items
  const navItems = [
    { text: 'Dashboard', onClick: () => setSelectedNavIndex(0) },
    { text: 'Library', onClick: () => setSelectedNavIndex(1) },
    { text: 'Search', onClick: () => setSelectedNavIndex(2) },
    { text: 'Settings', onClick: () => setSelectedNavIndex(3) },
    { text: 'Profile', onClick: () => setSelectedNavIndex(4) }
  ];

  return (
    <div className="testbed-container">
      {/* Back to App Navigation */}
      {onBackToApp && (
        <div className="testbed-header">
          <button className="back-to-app-button" onClick={onBackToApp}>
            <ArrowLeft />
            Back to App
          </button>
          <h1>Scary Testing Page</h1>
        </div>
      )}
      
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: '#1db954', marginBottom: '1rem' }}>Wizard Test</h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <label htmlFor="wizard-pane-slider" style={{ fontWeight: 600 }}>
            Max panes visible: {demoWindowSize}
          </label>
          <input
            id="wizard-pane-slider"
            type="range"
            min={1}
            max={3}
            step={1}
            value={demoWindowSize}
            onChange={event => setDemoWindowSize(Number(event.target.value))}
            style={{ flexGrow: 1, minWidth: '160px' }}
          />
        </div>
        <Wizard panes={wizardPanes} visibleRange={1} viewTitles={wizardViewTitles} />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: '#1db954', marginBottom: '1rem' }}>SlideNav Test</h3>
        <SlideNav items={navItems} selectedIndex={selectedNavIndex} />
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ color: '#1db954', marginBottom: '1rem' }}>Recently Played Tracks</h3>
        {recentTracksContainer ? (
          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #333', borderRadius: '8px', padding: '8px' }}>
            <TrackList trackContainer={recentTracksContainer} refreshTrigger={0} />
          </div>
        ) : (
          <div style={{ color: '#888888', textAlign: 'center', padding: '2rem' }}>
            Initializing...
          </div>
        )}
      </div>
    </div>
  );
}

interface WizardDemoPaneProps {
  heading: string;
  description: string;
  context: WizardPaneRenderContext;
}

function WizardDemoPane({ heading, description, context }: WizardDemoPaneProps) {
  const { self, panes, windowSize, windowStartIndex } = context;
  const visiblePeers = panes.filter(pane => pane.id !== self.id && pane.isVisible);
  const windowLabel = `${windowStartIndex + 1} - ${windowStartIndex + windowSize}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div>
        <h4 style={{ margin: 0 }}>{heading}</h4>
        <p style={{ margin: '0.25rem 0 0', color: '#b3b3b3' }}>{description}</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        <WizardDemoBadge label="Active" value={self.isActive ? 'Yes' : 'No'} />
        <WizardDemoBadge label="On Screen" value={self.isVisible ? 'Yes' : 'No'} />
        <WizardDemoBadge label="Reachable" value={self.isReachable ? 'Yes' : 'No'} />
        <WizardDemoBadge label="Window" value={`${windowSize} pane${windowSize > 1 ? 's' : ''}`} />
        <WizardDemoBadge label="Indices" value={windowLabel} />
        <WizardDemoBadge label="DOM Ready" value={self.element ? 'Yes' : 'No'} />
      </div>

      <div style={{ fontSize: '0.9rem' }}>
        <strong>Visible peers:</strong>{' '}
        {visiblePeers.length ? visiblePeers.map(peer => peer.title).join(', ') : 'None'}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {panes.map(peer => (
          <button
            key={peer.id}
            type="button"
            onClick={peer.goTo}
            disabled={peer.id === self.id}
            style={{
              background: peer.id === self.id ? 'rgba(29, 185, 84, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '999px',
              padding: '0.35rem 0.9rem',
              fontSize: '0.85rem',
              cursor: peer.id === self.id ? 'default' : 'pointer',
              opacity: peer.id === self.id ? 0.75 : 1
            }}
          >
            {peer.title}
            {peer.isActive ? ' • in view' : peer.isReachable ? ' • near' : ''}
          </button>
        ))}
      </div>
    </div>
  );
}

interface WizardDemoBadgeProps {
  label: string;
  value: string;
}

function WizardDemoBadge({ label, value }: WizardDemoBadgeProps) {
  return (
    <span
      style={{
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '999px',
        padding: '0.35rem 0.75rem',
        fontSize: '0.8rem',
        letterSpacing: '0.03em',
        textTransform: 'uppercase'
      }}
    >
      <strong style={{ marginRight: '0.35rem' }}>{label}:</strong>
      {value}
    </span>
  );
}