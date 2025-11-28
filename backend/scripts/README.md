# Airline Logo Management

## Overview
This directory contains scripts to download and manage airline logos for the Zambeel flight booking platform.

## Available Scripts

### 1. Download All Airline Logos (`download-airline-logos.ts`)
Downloads logos for all airlines in the database.

**Usage:**
```bash
cd backend
npx ts-node scripts/download-airline-logos.ts
```

**Features:**
- Fetches all airlines from the database
- Downloads logos from primary source (database URL)
- Falls back to multiple alternative sources if primary fails:
  1. Alibaba CDN
  2. Kiwi.com
  3. AVS.io
  4. AirHex
- Updates `logo-map.json` with successful downloads
- Reports failed downloads at the end

### 2. Download Missing Logos (`download-missing-logos.ts`)
Quick script to download specific missing airline logos.

**Usage:**
1. Edit the `MISSING_AIRLINES` array in the script with IATA codes
2. Run:
```bash
cd backend
npx ts-node scripts/download-missing-logos.ts
```

**Example:**
```typescript
const MISSING_AIRLINES = ['RI', 'RA', 'W5'];
```

## How It Works

### Frontend Integration
The frontend displays airline logos in two components:
- `flight-card.tsx` - Individual flight cards
- `group-flight-card.tsx` - Grouped flight cards

Both components include:
- **Error handling**: If an image fails to load, it shows a fallback airplane icon
- **Graceful degradation**: If airline data is missing, shows placeholder icon
- **Automatic fallback**: Uses the `AirlineIcon` component as fallback

### Backend Storage
- **Location**: `backend/src/assets/logos/airlines/`
- **Mapping**: `backend/src/assets/logos/logo-map.json`
- **Format**: PNG files named by IATA code (e.g., `IR.png`, `W5.png`)

## Logo Sources

The scripts try multiple sources in order:

1. **Primary**: Database `logo_url` field
2. **Alibaba CDN**: `https://cdn.alibaba.ir/static/img/airlines/Domestic/{IATA}.png`
3. **Kiwi.com**: `https://images.kiwi.com/airlines/64/{IATA}.png`
4. **AVS.io**: `https://pics.avs.io/200/200/{IATA}.png`
5. **AirHex**: `https://content.airhex.com/content/logos/airlines_{IATA}_200_200_s.png`

## Adding New Airlines

1. Add airline to database with `logo_url` field
2. Run the download script:
   ```bash
   npx ts-node scripts/download-airline-logos.ts
   ```
3. Or add to `download-missing-logos.ts` for targeted download

## Troubleshooting

### Logo Not Showing
1. Check if file exists in `src/assets/logos/airlines/`
2. Verify entry in `logo-map.json`
3. Check browser console for 404 errors
4. The frontend will automatically show a fallback airplane icon

### Download Failures
- Some airlines may not have logos in any source
- Check the script output for failed airline codes
- You can manually add logos to `src/assets/logos/airlines/`
- Update `logo-map.json` manually if needed

### Manual Logo Addition
1. Place logo file in `backend/src/assets/logos/airlines/{IATA}.png`
2. Add entry to `logo-map.json`:
   ```json
   {
     "XX": "./assets/logos/airlines/XX.png"
   }
   ```

## Frontend Fallback Icon

If a logo is missing or fails to load, the `AirlineIcon` component displays a generic airplane icon. This ensures users always see a visual indicator for the airline, maintaining a good user experience.

## Files Structure
```
backend/
├── scripts/
│   ├── download-airline-logos.ts      # Main script for all airlines
│   └── download-missing-logos.ts      # Quick script for specific airlines
└── src/
    └── assets/
        └── logos/
            ├── logo-map.json          # IATA code to file path mapping
            └── airlines/              # PNG logo files
                ├── IR.png
                ├── W5.png
                ├── RA.png
                └── ...

frontend/
└── src/
    └── components/
        ├── common/
        │   └── icons/
        │       └── AirlineIcon.tsx    # Fallback icon component
        └── flight-card/
            ├── flight-card.tsx        # Uses airline logos
            └── group-flight-card.tsx  # Uses airline logos
```
