import { FormEvent, ReactNode } from 'react';
import { ContentType } from './ItemTile';

export interface SearchPaneProps {
  contentType: ContentType;
  showMyItems: boolean;
  searchQuery: string;
  loading: boolean;
  itemTiles: ReactNode[];
  onToggleMyItems: (checked: boolean) => void;
  onContentTypeChange: (value: ContentType) => void;
  onSearchQueryChange: (value: string) => void;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

/**
 * Presentational pane that renders the search/selection controls used on SelectItemsPage.
 * It does not manage its own state; callers must supply all relevant props and handlers.
 */
export function SearchPane({
  contentType,
  showMyItems,
  searchQuery,
  loading,
  itemTiles,
  onToggleMyItems,
  onContentTypeChange,
  onSearchQueryChange,
  onSearchSubmit
}: SearchPaneProps) {
  const hasResults = itemTiles.length > 0;
  const placeholder = `Search ${contentType}s...`;
  const noResultsMessage = !showMyItems
    ? `No ${contentType}s found. Try a different search term.`
    : `No ${contentType}s found.`;

  return (
    <div className="search-pane">
      <div className="controls">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={showMyItems}
            onChange={(event) => onToggleMyItems(event.target.checked)}
          />
          My {contentType === 'playlist' ? 'Playlists' : 'Albums'}
        </label>

        <select
          value={contentType}
          onChange={(event) => onContentTypeChange(event.target.value as ContentType)}
          className="type-selector"
        >
          <option value="playlist">Playlists</option>
          <option value="album">Albums</option>
        </select>

        <form onSubmit={onSearchSubmit} className="search-form">
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
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
            <div className="no-results">
              {noResultsMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
