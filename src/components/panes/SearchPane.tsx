import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { PlusCircle, Search as SearchIcon, XmarkCircle } from 'iconoir-react';
import { ItemTile, ContentType } from '../tiles/ItemTile';
import { LoadingAnimation } from '../widgets/LoadingAnimation';
import { PaginatedList } from '../containers/PaginatedList';
import './SearchPane.css';
import {
  TrackContainer,
  PlaylistContainer,
  AlbumContainer,
  LikedSongsContainer,
  RecentTracksContainer
} from '../../data/TrackContainer';

export interface SearchPaneProps {
  sdk: SpotifyApi;
  onAddItem: (item: TrackContainer<any>) => void;
  initialContentType?: ContentType;
  selectedItems?: TrackContainer<any>[];
  recentTracksContainer?: RecentTracksContainer | null;
}

type SearchPage = {
  limit: number;
  next: string | null;
  offset: number;
  total: number;
} | null;

export function SearchPane({
  sdk,
  onAddItem,
  initialContentType = 'playlist',
  selectedItems = [],
  recentTracksContainer
}: SearchPaneProps) {
  const [contentType, setContentType] = useState<ContentType>(initialContentType);
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<TrackContainer<any>[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchPage>(null);
  const [personalPage, setPersonalPage] = useState<{ offset: number; limit: number; total: number | null }>({
    offset: 0,
    limit: 50,
    total: null
  });
  const [personalHasMore, setPersonalHasMore] = useState(false);
  const trimmedQuery = searchQuery.trim();
  const showingPersonalItems = trimmedQuery.length === 0;

  const selectedIds = useMemo(
    () => new Set(selectedItems.map(item => item.id)),
    [selectedItems]
  );

  const placeholder = `Search ${contentType}s...`;
  const noResultsMessage = showingPersonalItems
    ? `No ${contentType}s found.`
    : `No ${contentType}s found. Try a different search term.`;

  const fetchMyItems = useCallback(
    async (reset: boolean) => {
      const limit = personalPage.limit;
      const offset = reset ? 0 : personalPage.offset + personalPage.limit;

      reset ? setLoading(true) : setLoadingMore(true);

      try {
        let results: TrackContainer<any>[] = [];
        let total = personalPage.total ?? null;

        if (contentType === 'playlist') {
          if (reset) {
            const savedTracksResponse = await sdk.currentUser.tracks.savedTracks(1, 0);
            const likedSongs = new LikedSongsContainer(sdk, savedTracksResponse.total);
            results.push(likedSongs as unknown as TrackContainer<any>);
            if (recentTracksContainer) {
              results.push(recentTracksContainer as unknown as TrackContainer<any>);
            }
          }

          const userPlaylists = await sdk.currentUser.playlists.playlists(limit as any, offset as any);
          const playlistContainers = userPlaylists.items
            .filter((playlist): playlist is NonNullable<typeof playlist> => playlist != null)
            .map(playlist => new PlaylistContainer(sdk, playlist));

          results = reset ? [...results, ...playlistContainers] : playlistContainers;
          total = userPlaylists.total ?? total ?? null;
          setItems(prev => (reset ? results : [...prev, ...results]));
          setPersonalPage({
            offset: userPlaylists.offset ?? offset,
            limit: userPlaylists.limit ?? limit,
            total
          });
          setPersonalHasMore(Boolean(userPlaylists.next));
        } else {
          const savedAlbums = await sdk.currentUser.albums.savedAlbums(limit as any, offset as any);
          const albumContainers = savedAlbums.items.map(savedAlbum =>
            new AlbumContainer(sdk, savedAlbum.album as any) as TrackContainer<any>
          );
          results = albumContainers;
          total = savedAlbums.total ?? total ?? null;
          setItems(prev => (reset ? results : [...prev, ...results]));
          setPersonalPage({
            offset: savedAlbums.offset ?? offset,
            limit: savedAlbums.limit ?? limit,
            total
          });
          setPersonalHasMore(Boolean(savedAlbums.next));
        }

        setSearchResults(null);
      } catch (error) {
        console.error('Error fetching personal items:', error);
        if (reset) {
          setItems([]);
          setPersonalPage({ offset: 0, limit, total: null });
          setPersonalHasMore(false);
        }
      } finally {
        reset ? setLoading(false) : setLoadingMore(false);
      }
    },
    [contentType, personalPage.limit, personalPage.offset, personalPage.total, recentTracksContainer, sdk]
  );

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
    if (showingPersonalItems) {
      fetchMyItems(true);
    }
  }, [showingPersonalItems, fetchMyItems]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (trimmedQuery) {
      performSearch(false);
    }
  };

  const loadMore = () => {
    if (showingPersonalItems) {
      if (personalHasMore && !loadingMore) {
        void fetchMyItems(false);
      }
      return;
    }
    if (searchResults?.next) {
      performSearch(true);
    }
  };

  const filteredItems = useMemo(
    () => items.filter(item => !selectedIds.has(item.id)),
    [items, selectedIds]
  );

  const hasMoreItems = showingPersonalItems
    ? personalHasMore
    : Boolean(
        searchResults &&
          searchResults.next &&
          searchResults.offset + searchResults.limit < searchResults.total
      );
  const remainingItems = showingPersonalItems
    ? Math.max(0, (personalPage.total ?? 0) - (personalPage.offset + personalPage.limit))
    : searchResults
    ? Math.max(0, searchResults.total - (searchResults.offset + searchResults.limit))
    : 0;

  const handleAddItem = useCallback(
    (item: TrackContainer<any>) => {
      if (selectedIds.has(item.id)) {
        return;
      }
      onAddItem(item);
    },
    [onAddItem, selectedIds]
  );

  const itemTiles = filteredItems.map(item => (
    <ItemTile
      key={item.id}
      item={item}
      contentType={contentType}
      controls={
        <button
          className="control-button add-button"
          onClick={() => handleAddItem(item)}
          aria-label={`Add ${item.name} to selection`}
          disabled={selectedIds.has(item.id)}
          title={selectedIds.has(item.id) ? 'Already added' : `Add ${item.name}`}
        >
          <PlusCircle />
        </button>
      }
    />
  ));

  const loadMoreLabel = loadingMore ? 'Loading…' : `Load More (${remainingItems} remaining)`;

  const handleClearSearch = () => {
    if (!searchQuery) {
      return;
    }
    setSearchQuery('');
    setItems([]);
    setSearchResults(null);
  };

  const searchContent = (
    <div className="search-pane">
      <div className="search-controls">
        <select
          value={contentType}
          onChange={event => setContentType(event.target.value as ContentType)}
          className="type-selector"
        >
          <option value="playlist">Playlists</option>
          <option value="album">Albums</option>
        </select>

        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <XmarkCircle
                role="button"
                tabIndex={0}
                aria-label="Clear search"
                className="search-clear-icon"
                onClick={handleClearSearch}
                onKeyDown={(event: KeyboardEvent<SVGSVGElement>) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleClearSearch();
                  }
                }}
              />
            )}
          </div>
          <button
            type="submit"
            className="search-submit-icon"
            disabled={!trimmedQuery}
            aria-label="Search"
          >
            <SearchIcon />
          </button>
        </form>
      </div>

      <PaginatedList
        isLoading={loading}
        items={itemTiles}
        loadingMessage={<LoadingAnimation label={`Loading ${contentType}s…`} />}
        emptyMessage={<div className="no-results">{noResultsMessage}</div>}
        hasMore={hasMoreItems}
        onLoadMore={loadMore}
        loadMoreLabel={loadMoreLabel}
        loadingMore={loadingMore}
        className="search-results"
        itemsWrapperElement="div"
        itemsClassName="playlist-container"
      />
    </div>
  );

  return (
    <div className="select-items-container">
      <div className="content-area">
        <div className="left-panel">{searchContent}</div>
      </div>
    </div>
  );
}
