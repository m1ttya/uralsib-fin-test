import React from 'react';

// Use Mozilla PDF.js web viewer via CDN inside iframe (fast, smooth scrolling, no bundler config)
export default function PdfViewer({ url, className = '' }: { url: string; className?: string }) {
  const fileUrl = typeof window !== 'undefined' ? new URL(url, window.location.origin).href : url;
  const viewerUrl = `${window.location.origin}${import.meta.env.BASE_URL}pdf-viewer.html?file=${encodeURIComponent(fileUrl)}`;
  return (
    <div className={className}>
      <iframe
        src={viewerUrl}
        title="PDF"
        className="w-full h-[70vh] border-0"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
