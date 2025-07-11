# Offline Maps Files

This directory should contain the PMTiles files for offline map functionality, but they are excluded from Git due to their large size.

## Getting the PMTiles Files

To use offline maps in this application, you'll need to download or generate the required PMTiles files:

### Option 1: Download from Team Storage

Team members can download the pre-generated PMTiles files from our shared storage:
- Internal link: [team-share/maps/](http://internal-link-to-storage)
- Download the required region files and place them in this directory

### Option 2: Generate Your Own PMTiles

Follow these steps to generate PMTiles for your region of interest:

1. Install the PMTiles CLI tool:
   ```bash
   npm install -g pmtiles
   ```

2. Extract a region from the Protomaps base layer:
   ```bash
   # Extract a specific geographical area using bounding box coordinates
   # Format: --bbox=min_lon,min_lat,max_lon,max_lat
   pmtiles extract https://build.protomaps.com/20250708.pmtiles singapore.pmtiles --bbox=103.6,1.2,104.1,1.5
   ```

3. Optimize for size if needed:
   ```bash
   # Limit maximum zoom level (reduces file size significantly)
   pmtiles extract source.pmtiles reduced_zoom.pmtiles --maxzoom=12
   ```

4. Place the generated `.pmtiles` files in this directory.

## Required Files

The application expects the following files by default:
- `default.pmtiles` - Default offline map used when no specific region is selected
- `singapore.pmtiles` - Singapore region map
- `queensland.pmtiles` - Queensland region map

See the Developer Guide for more detailed information on working with offline maps.