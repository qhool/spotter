import { ReactNode } from 'react';
import './PaginatedList.css';

type WrapperElement = keyof JSX.IntrinsicElements;

interface PaginatedListProps {
  isLoading: boolean;
  items: ReactNode[];
  loadingMessage?: ReactNode;
  emptyMessage?: ReactNode;
  errorMessage?: ReactNode | null;
  onRetry?: () => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadMoreLabel?: ReactNode;
  loadingMore?: boolean;
  className?: string;
  itemsWrapperElement?: WrapperElement;
  itemsClassName?: string;
}

export function PaginatedList({
  isLoading,
  items,
  loadingMessage = 'Loading…',
  emptyMessage = 'No items found.',
  errorMessage,
  onRetry,
  hasMore = false,
  onLoadMore,
  loadMoreLabel = 'Load more',
  loadingMore = false,
  className,
  itemsWrapperElement: ItemsWrapper = 'div',
  itemsClassName
}: PaginatedListProps) {
  const wrapperClassNames = ['paginated-list', className].filter(Boolean).join(' ');

  if (isLoading) {
    return <div className={wrapperClassNames}>{loadingMessage}</div>;
  }

  if (errorMessage) {
    return (
      <div className={wrapperClassNames}>
        <p>{errorMessage}</p>
        {onRetry && (
          <button type="button" className="text-button" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    );
  }

  const hasItems = items.length > 0;

  return (
    <div className={wrapperClassNames}>
      {hasItems ? (
        <>
          <ItemsWrapper className={itemsClassName}>{items}</ItemsWrapper>
          {hasMore && onLoadMore && (
            <div className="paginated-list__actions">
              <button
                type="button"
                className="text-button"
                onClick={onLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading…' : loadMoreLabel}
              </button>
            </div>
          )}
        </>
      ) : (
        <p>{emptyMessage}</p>
      )}
    </div>
  );
}
