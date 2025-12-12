import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { ItemTile, ContentType } from './ItemTile';
import { ButtonTile } from './ButtonTile';
import './SearchPane.css';
import {
  TrackContainer,
  PlaylistContainer,
  AlbumContainer,
  LikedSongsContainer
} from '../data/TrackContainer';

export interface SearchPaneProps {
  sdk: SpotifyApi;
  initialContentType?: ContentType;
  initialShowMyItems?: boolean;
  selectedItems?: TrackContainer<any>[];
  renderControls?: (item: TrackContainer<any>) => ReactNode;
}

type SearchPage = {
  limit: number;
  next: string | null;
  offset: number;
  total: number;
} | null;

export function SearchPane({
  sdk,
  initialContentType = 'playlist',
  initialShowMyItems = true,
  selectedItems = [],
  renderControls
}: SearchPaneProps) {
  const [contentType, setContentType] = useState<ContentType>(initialContentType);
  const [showMyItems, setShowMyItems] = useState(initialShowMyItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<TrackContainer<any>[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchPage>(null);

  const selectedIds = useMemo(
    () => new Set(selectedItems.map(item => item.id)),
    [selectedItems]
  );

  const placeholder = `Search ${contentType}s...`;
  const noResultsMessage = !showMyItems
    ? `No ${contentType}s found. Try a different search term.`
    : `No ${contentType}s found.`;

  const fetchMyItems = useCallback(async () => {
    setLoading(true);
    try {
      let results: TrackContainer<any>[] = [];
      if (contentType === 'playlist') {
        const savedTracksResponse = await sdk.currentUser.tracks.savedTracks(1, 0);
        const likedSongs = new LikedSongsContainer(sdk, savedTracksResponse.total);
        const userPlaylists = await sdk.currentUser.playlists.playlists();
        const playlistContainers = userPlaylists.items
          .filter((playlist): playlist is NonNullable<typeof playlist> => playlist != null)
          .map(playlist => new PlaylistContainer(sdk, playlist));
        results = [likedSongs as unknown as TrackContainer<any>, ...playlistContainers];
      } else {
        const savedAlbums = await sdk.currentUser.albums.savedAlbums();
        results = savedAlbums.items.map(savedAlbum =>
          new AlbumContainer(sdk, savedAlbum.album as any) as TrackContainer<any>
        );
      }
      setItems(results);
      setSearchResults(null);
    } catch (error) {
      console.error('Error fetching personal items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [sdk, contentType]);

  const performSearch = useCallback(
    async (append = false) => {
      const trimmedQuery = searchQuery.trim();
      if (!trimmedQuery) {
        return;
      }

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setItems([]);
        setSearchResults(null);
      }

      try {
        const limit = (append && searchResults ? searchResults.limit : 50) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50;
        const offset = append && searchResults ? searchResults.offset + searchResults.limit : 0;
        const response = await sdk.search(trimmedQuery, [contentType], undefined, limit, offset);
        const pageData =
          contentType === 'playlist' ? response.playlists ?? null : response.albums ?? null;

        const results: TrackContainer<any>[] = [];
        (pageData?.items ?? []).forEach(item => {
          if (!item) {
            return;
          }
          results.push(
            contentType === 'playlist'
              ? new PlaylistContainer(sdk, item as any)
              : new AlbumContainer(sdk, item as any)
          );
        });

        setItems(prev => (append ? [...prev, ...results] : results));
        setSearchResults(
          pageData
            ? {
                limit: pageData.limit,
                next: pageData.next,
                offset: pageData.offset,
                total: pageData.total
              }
            : null
        );
      } catch (error) {
        console.error('Error performing search:', error);
        if (!append) {
          setItems([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [contentType, sdk, searchQuery, searchResults]
  );

  useEffect(() => {
    if (showMyItems) {
      fetchMyItems();
    } else {
      setItems([]);
      setSearchResults(null);
    }
  }, [showMyItems, fetchMyItems]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!showMyItems && searchQuery.trim()) {
      performSearch(false);
    }
  };

  const loadMore = () => {
    if (searchResults?.next) {
      performSearch(true);
    }
  };

  const filteredItems = useMemo(
    () => items.filter(item => !selectedIds.has(item.id)),
    [items, selectedIds]
  );

  const hasMoreItems = Boolean(
    !showMyItems && searchResults && searchResults.next &&
      searchResults.offset + searchResults.limit < searchResults.total
  );
  const remainingItems = searchResults
    ? Math.max(0, searchResults.total - (searchResults.offset + searchResults.limit))
    : 0;

  const itemTiles = filteredItems.map(item => (
    <ItemTile
      key={item.id}
      item={item}
      contentType={contentType}
      controls={renderControls ? renderControls(item) : undefined}
    />
  ));

  if (!showMyItems && hasMoreItems && !loading) {
    itemTiles.push(
      <ButtonTile
        key="load-more"
        name={loadingMore ? 'Loading…' : `Load More (${remainingItems} remaining)`}
        onClick={loadMore}
        disabled={loadingMore}
      />
    );
  }

  const hasResults = itemTiles.length > 0;

  return (
    <div className="search-pane">
      <div className="controls">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={showMyItems}
            onChange={event => setShowMyItems(event.target.checked)}
          />
          My {contentType === 'playlist' ? 'Playlists' : 'Albums'}
        </label>

        <select
          value={contentType}
          onChange={event => setContentType(event.target.value as ContentType)}
          className="type-selector"
        >
          <option value="playlist">Playlists</option>
          <option value="album">Albums</option>
        </select>

        <form onSubmit={handleSearchSubmit} className="search-form">
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            className="search-input"
            disabled={showMyItems}
          />
          <button type="submit" disabled={showMyItems || !searchQuery.trim()}>
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="playlist-container">
          {hasResults ? (
            itemTiles
          ) : (
            <div className="no-results">{noResultsMessage}</div>
          )}
        </div>
      )}
    </div>
  );
}
