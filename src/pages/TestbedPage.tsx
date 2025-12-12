import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { useState, useMemo } from 'react';
import { Wizard, WizardPane, WizardViewTitles } from '../components/Wizard';
import { SearchPane } from '../components/SearchPane';

interface TestbedPageProps {
  sdk: SpotifyApi;
}

export function TestbedPage({ sdk }: TestbedPageProps) {
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
        render: () => <SearchPane sdk={sdk} />
      },
      {
        id: 'remix',
        title: 'Remix',
        render: () => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <h4 style={{ margin: 0 }}>Remix</h4>
              <p style={{ margin: '0.25rem 0 0', color: '#b3b3b3' }}>
                Blend tracks, adjust order, and audition transitions.
              </p>
            </div>
          </div>
        )
      },
      {
        id: 'export',
        title: 'Export',
        render: () => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <h4 style={{ margin: 0 }}>Export</h4>
              <p style={{ margin: '0.25rem 0 0', color: '#b3b3b3' }}>
                Send finished playlists back to Spotify or share externally.
              </p>
            </div>
          </div>
        )
      }
    ],
    [sdk]
  );

  return (
    <div className="testbed-container">
      <div style={{ flex: 1, display: 'flex', gap: '1.5rem', minHeight: 0 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: '60px',
            justifyContent: 'center',
            height: '100%'
          }}
        >
          <span style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Panes</span>
          <input
            id="wizard-pane-slider"
            type="range"
            min={1}
            max={3}
            step={1}
            value={demoWindowSize}
            onChange={event => setDemoWindowSize(Number(event.target.value))}
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: '180px' }}
          />
          <span style={{ marginTop: '0.5rem', fontWeight: 600 }}>{demoWindowSize}</span>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <Wizard
            className="testbed-wizard"
            panes={wizardPanes}
            visibleRange={1}
            viewTitles={wizardViewTitles}
          />
        </div>
      </div>
    </div>
  );
}
