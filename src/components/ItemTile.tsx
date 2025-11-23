import './ItemTile.css';

export type ContentType = 'playlist' | 'album';

interface ItemTileProps {
  item: any;
  contentType: ContentType;
}

export function ItemTile({ item, contentType }: ItemTileProps) {
  console.log('Rendering item:', item); // Debug log
  const coverImage = item.images && item.images.length > 0 ? item.images[0] : null;
  
  // Determine content for description and metadata based on content type
  let description = '';
  let track_count = '';
  
  if (contentType === 'playlist') {
    // Playlists: use actual description, show track count in metadata
    description = item.description || '';
    track_count = `${item.tracks?.total || 0} tracks`;
  } else if (contentType === 'album') {
    // Albums: show artist + year in description, track count in metadata
    console.log('Album artists:', item.artists); // Debug log
    const artistName = item.artists && item.artists.length > 0 ? item.artists[0].name : 'Unknown Artist';
    const releaseYear = item.release_date ? item.release_date.slice(0, 4) : '';
    description = `${artistName}${releaseYear ? ' • ' + releaseYear : ''}`;
    track_count = `${item.total_tracks || 0} tracks`;
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
        {description && (
          <p className="item-description">{description}</p>
        )}
      </div>
      <div className="item-meta">
        <span className="item-metadata">{track_count}</span>
      </div>
    </div>
  );
}