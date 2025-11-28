# Safar366 Frontend Integration Fix

## Problem Identified

When searching for flights at `http://localhost:3000/flight/THR/MHD?flightDirection=domestic&available=%D9%85%D9%88%D8%AC%D9%88%D8%AF&departureDate=2025-12-01`, safar366 results were not appearing while other scrapers (alibaba, safarmarket, etc.) were working correctly.

## Root Cause

The issue was in the **frontend**, not the backend or scraper. The frontend's `useFetchFlights.ts` hook contained a hardcoded list of providers that **excluded safar366**:

```typescript
// BEFORE (line 47-52)
const providers = [
  'alibaba',
  'flytoday',
  'mrbilit',
  'pateh',
  'safarmarket',
  // safar366 was missing!
];
```

The frontend loops through this array and makes individual API calls to the backend for each provider. Since `'safar366'` wasn't in the list, it never got queried.

## How the System Works

1. **Frontend** (`useFetchFlights.ts`):
   - Loops through the `providers` array
   - For each provider, calls `fetchFlights({ provider_name: provider, requests })`
   - Makes individual API requests to backend for EACH provider

2. **Backend** (`scraper.service.ts`):
   - Receives `provider_name` in the request
   - Forwards to Python scraper via gRPC with the specific provider name

3. **Scraper** (`main.py`):
   - Receives request with `choose_provider_name`
   - Only executes the crawler that matches `choose_provider_name`
   ```python
   for provider_name, provider_crawler in providers.items():
       if provider_name == choose_provider_name:
           await crawl_with_thread(...)
   ```

## Files Modified

### 1. Frontend Hook (`frontend/src/hooks/useFetchFlights.ts`)

**Changed lines 47-52:**
```typescript
const providers = [
  'alibaba',
  'flytoday',
  'mrbilit',
  'pateh',
  'safarmarket',
  'safar366',  // ✅ ADDED
];
```

### 2. Provider Constants (`frontend/src/components/flight-search/constants.ts`)

**Added to provider name list (line 16):**
```typescript
export const providerNameList = [
  { label: 'پته', value: 'pateh' },
  { label: 'مستر بلیط', value: 'mrbilit' },
  { label: 'فلای تودی', value: 'flytoday' },
  { label: 'علی بابا', value: 'alibaba' },
  { label: 'سفرمارکت', value: 'safarmarket' },
  { label: 'سفر۳۶۶', value: 'safar366' },  // ✅ ADDED
];
```

**Added logo mapping (line 27-28):**
```typescript
export const getProviderLogo = (provider: string) => {
  if (provider.startsWith('pateh')) return '/logo/providers/pateh.png';
  if (provider.startsWith('mrbilit')) return '/logo/providers/mrbilit.png';
  if (provider.startsWith('flytoday')) return '/logo/providers/flytoday.png';
  if (provider.startsWith('alibaba')) return '/logo/providers/alibaba.png';
  if (provider.startsWith('safarmarket'))
    return '/logo/providers/safarmarket.jpeg';
  if (provider.startsWith('safar366'))
    return '/logo/providers/safar366.svg';  // ✅ ADDED
  return '';
};
```

### 3. Logo File (`frontend/public/logo/providers/safar366.svg`)

Created a simple SVG logo placeholder for safar366.

## Testing

After these changes, when you search for flights:

1. Frontend will now include `'safar366'` in its provider loop
2. Backend will receive a request with `provider_name: 'safar366'`
3. Scraper will execute the safar366 crawler
4. Results will be displayed alongside other providers

## How to Verify

1. **Rebuild and restart the services:**
   ```bash
   docker-compose down
   docker-compose up --build
   ```

2. **Search for flights:**
   Navigate to: `http://localhost:3000/flight/THR/MHD?flightDirection=domestic&departureDate=2025-12-01`

3. **Check results:**
   - You should now see flights from safar366 appearing in the results
   - The safar366 logo (blue "Safar366" text) should appear on flight cards
   - Filter panel should show "سفر۳۶۶" as an available provider

4. **Verify in browser console/network tab:**
   - Should see 6 API calls to `/flights/search` (one for each provider including safar366)
   - safar366 response should contain flight data

## Summary of Complete Integration

✅ **Backend**: Already configured correctly
✅ **Scraper**: safar366.py implemented and integrated in main.py
✅ **Data Mapping**: Corrected to match actual API structure
✅ **Frontend Hook**: Added 'safar366' to providers array
✅ **Provider List**: Added to UI constants with Farsi label
✅ **Logo**: Created SVG placeholder
✅ **Logo Mapping**: Added to getProviderLogo function

The integration is now **100% complete** and safar366 should appear in search results!
