import './ItemTile.css';

export type ContentType = 'playlist' | 'album';

interface ItemTileProps {
  item: any;
  contentType: ContentType;
}

export function ItemTile({ item, contentType }: ItemTileProps) {
  console.log('Rendering item:', item); // Debug log
  const coverImage = item.images && item.images.length > 0 ? item.images[0] : null;
  
  // Determine metadata based on content type
  let metadata = '';
  if (contentType === 'playlist') {
    metadata = `${item.tracks?.total || 0} tracks`;
  } else if (contentType === 'album') {
    console.log('Album artists:', item.artists); // Debug log
    const artistName = item.artists && item.artists.length > 0 ? item.artists[0].name : 'Unknown Artist';
    const releaseYear = item.release_date ? item.release_date.slice(0, 4) : '';
    metadata = `${artistName}${releaseYear ? ' • ' + releaseYear : ''}`;
  }
  
  return (
    <div className="item-tile">
      <div className="item-image">
        {coverImage ? (
          <img 
            src={coverImage.url} 
            alt={`${item.name} cover`}
            className="cover-image"
          />
        ) : (
          <div className="placeholder-image">{contentType === 'playlist' ? '♪' : '♫'}</div>
        )}
      </div>
      <div className="item-content">
        <h3 className="item-title">{item.name}</h3>
        {item.description && (
          <p className="item-description">{item.description}</p>
        )}
      </div>
      <div className="item-meta">
        <span className="item-metadata">{metadata}</span>
      </div>
    </div>
  );
}