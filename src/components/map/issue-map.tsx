// src/components/map/issue-map.tsx

import React from 'react';
import { cn } from '@/lib/utils'; // Keep cn if used for className

// Interface for props (optional, but good practice)
interface IssueMapProps {
  height?: string;
  // Remove interactive prop as it's no longer relevant
  imageUrl?: string; // Optional prop to pass image URL
  altText?: string; // Optional alt text
}

// --- REMOVED ALL LEAFLET/MAPBOX/FIRESTORE IMPORTS AND LOGIC ---

// Replace this with the actual URL of your chosen map image or GIF
const DEFAULT_MAP_IMAGE_URL = "https://paintmaps.com/og_image/map_chart/map_chart_164.png"; // Example: Static map of Nepal districts
// Or use a GIF: const DEFAULT_MAP_IMAGE_URL = "/path/to/your/map.gif";
// Or the placeholder: const DEFAULT_MAP_IMAGE_URL = "https://via.placeholder.com/800x450.png?text=Map+Preview+of+Nepal";


export const IssueMap = ({
    height = "400px",
    imageUrl = DEFAULT_MAP_IMAGE_URL,
    altText = "Map showing issue locations or activity",
    className // Allow passing additional classes
}: IssueMapProps & React.HTMLAttributes<HTMLDivElement>) => { // Add HTMLAttributes for className etc.

  return (
    <div
      className={cn(
        "w-full rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center", // Center content if image is smaller
        className // Apply passed className
      )}
      style={{ height }} // Apply height dynamically
    >
      <img
        src={imageUrl}
        alt={altText}
        className="w-full h-full object-contain" // Use 'object-contain' to fit the image without cropping, or 'object-cover' to fill and crop
        loading="lazy" // Lazy load the image
      />
    </div>
  );
};