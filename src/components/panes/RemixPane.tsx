import { useEffect, useMemo, useState } from 'react';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { TrackListPane } from './TrackListPane';
import { TrackContainer, RemixContainer } from '../../data/TrackContainer';
import { RemixMethod, RemixOptions, getRemixFunction } from '../../data/RemixFunctions';
import { RemixControls } from '../widgets/RemixControls';

interface RemixPaneProps {
  sdk: SpotifyApi;
  selectedItems: TrackContainer<any>[];
  excludedTrackIds: Set<string>;
  setExcludedTrackIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  onRemixContainerChange?: (container: RemixContainer<RemixOptions> | null) => void;
  itemOptionsById?: Partial<Record<string, RemixOptions>>;
  className?: string;
  refreshTrigger: number;
  onRefresh: () => void | Promise<void>;
  trackCount: number;
  showControls?: boolean;
  remixMethod: RemixMethod;
  setRemixMethod: (method: RemixMethod) => void;
}

const REMIX_METHOD_OPTIONS: RemixMethod[] = ['shuffle', 'concatenate'];

export function RemixPane({
  sdk,
  selectedItems,
  excludedTrackIds,
  setExcludedTrackIds,
  onRemixContainerChange,
  itemOptionsById = {} as Partial<Record<string, RemixOptions>>,
  className,
  refreshTrigger,
  onRefresh,
  trackCount,
  showControls = true,
  remixMethod,
  setRemixMethod
}: RemixPaneProps) {
  const [remixContainer, setRemixContainer] = useState<RemixContainer<RemixOptions> | null>(null);
  const selectedTrackCount = useMemo(
    () =>
      selectedItems.reduce((sum, item) => {
        const count =
          typeof (item as any).getTrackCount === 'function'
            ? (item as any).getTrackCount()
            : (item as any).totalCount;
        return sum + (typeof count === 'number' && isFinite(count) ? count : 0);
      }, 0),
    [selectedItems]
  );

  const remixTrackCount = remixContainer?.getTrackCount?.();
  const trackCountLabel = `${
    typeof remixTrackCount === 'number' && isFinite(remixTrackCount) ? remixTrackCount : trackCount ?? selectedTrackCount
  } Tracks`;

  useEffect(() => {
    if (selectedItems.length === 0) {
      setRemixContainer(null);
      onRemixContainerChange?.(null);
      return;
    }

    const inputs: [TrackContainer<any>, RemixOptions][] = selectedItems.map(item => [
      item,
      itemOptionsById[item.id] ?? ({} as RemixOptions)
    ]);
    const remixFunction = getRemixFunction(remixMethod);
    const container = new RemixContainer(
      sdk,
      inputs,
      remixFunction,
      'Spotter Remix',
      `Combined tracks from ${selectedItems.length} source(s) - ${remixMethod}`
    );
    setRemixContainer(container);
    onRemixContainerChange?.(container);
  }, [sdk, selectedItems, remixMethod, onRemixContainerChange, itemOptionsById]);

  const controls = (
    <>
      <RemixControls
        trackCount={
          typeof remixTrackCount === 'number' && isFinite(remixTrackCount) ? remixTrackCount : trackCount ?? selectedTrackCount
        }
        label={trackCountLabel}
        remixMethod={remixMethod}
        methodOptions={REMIX_METHOD_OPTIONS}
        onMethodChange={value => setRemixMethod(value as RemixMethod)}
        onRefresh={onRefresh}
        buttonClassName="track-list-pane__refresh-button"
        hidden={!showControls}
        disabled={!remixContainer}
      />
    </>
  );

  return (
    <TrackListPane
      remixContainer={remixContainer}
      excludedTrackIds={excludedTrackIds}
      setExcludedTrackIds={setExcludedTrackIds}
      refreshTrigger={refreshTrigger}
      controls={controls}
      className={className}
    />
  );
}
