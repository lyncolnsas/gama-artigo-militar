import React from 'react';

export default function MediaViewer({ mediaUrl, mediaType, className = "" }) {
  if (!mediaUrl) {
    return (
      <div className={`w-full h-full min-h-[200px] flex items-center justify-center bg-gray-800 text-gray-400 border border-dashed border-gray-700 rounded-lg ${className}`}>
        <span>Sem mídia selecionada</span>
      </div>
    );
  }

  // 1. Vídeo do YouTube
  if (mediaType === 'YOUTUBE' || mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be')) {
    let videoId = '';
    if (mediaUrl.includes('v=')) {
      videoId = mediaUrl.split('v=')[1].split('&')[0];
    } else {
      videoId = mediaUrl.split('/').pop().split('?')[0];
    }

    return (
      <div className={`aspect-video w-full overflow-hidden rounded-xl bg-black ${className}`}>
        <iframe
          className="w-full h-full border-0"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1`}
          title="YouTube Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // 2. Vídeo do Instagram
  if (mediaType === 'INSTAGRAM' || mediaUrl.includes('instagram.com')) {
    const cleanUrl = mediaUrl.split('?')[0].replace(/\/$/, "");
    return (
      <div className={`aspect-square w-full overflow-hidden rounded-xl bg-black ${className}`}>
        <iframe
          className="w-full h-full border-0"
          src={`${cleanUrl}/embed`}
          allowTransparency="true"
          title="Instagram Embed"
        />
      </div>
    );
  }

  // 3. Arquivo de Vídeo Local (MP4/WebM)
  if (mediaType === 'VIDEO_FILE' || mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm') || mediaUrl.includes('/uploads/')) {
    const isVideo = mediaType === 'VIDEO_FILE' || mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm');
    if (isVideo) {
      return (
        <video 
          src={mediaUrl} 
          controls 
          autoPlay 
          muted 
          loop 
          className={`w-full h-full object-cover rounded-xl ${className}`} 
        />
      );
    }
  }

  // 4. Imagem Padrão
  return (
    <img 
      src={mediaUrl} 
      alt="Mídia do Produto ou Seção" 
      className={`w-full h-full object-cover rounded-xl ${className}`} 
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
      }}
    />
  );
}
