# Progressive Flight Search - Testing Guide

## Quick Start Testing

### 1. Start the Services

```bash
# Terminal 1: Start Backend
cd /Users/hamid/Desktop/Work/zambeel/zambel/backend
npm run start:dev

# Terminal 2: Start Frontend
cd /Users/hamid/Desktop/Work/zambeel/zambel/frontend
npm run dev

# Terminal 3 (Optional): Start Scraper Service
cd /Users/hamid/Desktop/Work/zambeel/zambel/scrapper
python fastapi_main.py
```

### 2. Test the Feature

1. **Open Browser**: Navigate to `http://localhost:3000`

2. **Search for Flights**:
   - Origin: THR (Tehran)
   - Destination: MHD (Mashhad)
   - Date: Any future date (e.g., 2025-12-20)
   - Click "جستجو" button

3. **Observe Progressive Loading**:
   - ✅ Progress bar should appear immediately
   - ✅ First results appear in 2-5 seconds
   - ✅ Provider badges update in real-time
   - ✅ New flights slide in with animation
   - ✅ Updated flights show glow effect
   - ✅ Final results within 15-20 seconds

## Detailed Test Cases

### Test Case 1: Basic Search Flow
**Objective**: Verify progressive loading works correctly

**Steps**:
1. Start all services
2. Navigate to home page
3. Enter search criteria:
   - Origin: THR
   - Destination: MHD
   - Date: 2025-12-20
4. Click search

**Expected Results**:
- ✅ Redirected to `/flight-stream/THR/MHD`
- ✅ Progress bar visible with "جستجو در حال انجام..."
- ✅ Provider badges show: alibaba ⊘ | mrbilit ⊘ | safar366 ⊘ | safarmarket ⊘
- ✅ First results appear within 5 seconds
- ✅ Provider badge updates to: alibaba ✓
- ✅ Flight cards slide in with animation
- ✅ More results arrive progressively
- ✅ All provider badges eventually show ✓ or ❌
- ✅ Loading indicator disappears when complete
- ✅ Final count shows total flights and options

### Test Case 2: Flight Merging
**Objective**: Verify flights with same base_flight_id are merged correctly

**Steps**:
1. Search for a popular route (THR → MHD)
2. Watch as results come in from multiple providers
3. Look for flights with same flight number appearing in different providers

**Expected Results**:
- ✅ No duplicate flight cards displayed
- ✅ Provider count increases when same flight found: "2 منبع" → "3 منبع"
- ✅ Price range updates: "2,300,000 تا 2,500,000 تومان"
- ✅ Glow animation appears on updated cards
- ✅ "گزینه قیمتی موجود" count increases

**How to Verify**:
```javascript
// Open browser console
// Count unique base_flight_ids
const cards = document.querySelectorAll('[data-flight-id]');
const ids = new Set([...cards].map(c => c.dataset.flightId));
console.log('Unique flights:', ids.size);
console.log('Total cards:', cards.length);
// These should be equal
```

### Test Case 3: Animations
**Objective**: Verify all animations work smoothly

**Steps**:
1. Start search
2. Watch carefully as each provider responds
3. Note the animations

**Expected Results**:
- ✅ **Slide-in animation**: New flights appear from below (translateY: 20px → 0)
- ✅ **Fade-in**: Opacity goes from 0 to 1 smoothly
- ✅ **Pulse-glow**: Updated cards glow briefly in amber color
- ✅ **Progress bar**: Fills smoothly from left to right
- ✅ **Badge animations**: Provider badges change color smoothly
- ✅ All animations feel natural and professional

### Test Case 4: Error Handling
**Objective**: Verify system handles errors gracefully

**Steps**:
1. Stop the scraper service
2. Search for flights
3. Observe behavior

**Expected Results**:
- ✅ Search continues despite provider failures
- ✅ Failed provider badges show red color: ❌
- ✅ Error message: "Failed providers: ..." appears
- ✅ Successful providers still show results
- ✅ User can still browse available flights

### Test Case 5: Filtering & Sorting
**Objective**: Verify filters work with streaming data

**Steps**:
1. Complete a search with results from multiple providers
2. Use provider filter: Select "alibaba"
3. Use airline filter: Select a specific airline
4. Change sort: Select "زودترین پرواز"

**Expected Results**:
- ✅ Only alibaba flights shown when filtered
- ✅ Only selected airline flights shown
- ✅ Flights re-sorted by departure time
- ✅ Animations don't break during filtering
- ✅ Flight count updates correctly

### Test Case 6: Network Interruption
**Objective**: Verify resilience to network issues

**Steps**:
1. Start a search
2. While loading, open Chrome DevTools → Network
3. Enable "Offline" mode after first provider responds
4. Re-enable network after a few seconds

**Expected Results**:
- ✅ EventSource shows connection error
- ✅ User sees error message
- ✅ Already-loaded flights remain visible
- ✅ User can still interact with loaded flights

### Test Case 7: Multiple Concurrent Searches
**Objective**: Verify system handles multiple searches

**Steps**:
1. Open browser tab 1: Search THR → MHD
2. Open browser tab 2: Search THR → IKA
3. Both searches run simultaneously

**Expected Results**:
- ✅ Both searches complete successfully
- ✅ Results don't mix between tabs
- ✅ Each tab shows correct results
- ✅ No console errors

### Test Case 8: Mobile Responsiveness
**Objective**: Verify feature works on mobile

**Steps**:
1. Open Chrome DevTools
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select "iPhone 12 Pro"
4. Search for flights

**Expected Results**:
- ✅ Layout adapts to mobile screen
- ✅ Progress bar visible and functional
- ✅ Flight cards stack vertically
- ✅ Touch interactions work
- ✅ Animations smooth on mobile
- ✅ No horizontal scroll

## Performance Testing

### Metric 1: Time to First Result
**Target**: < 5 seconds

**Test**:
```bash
# Terminal: Time the first provider response
curl -N "http://localhost:8080/flights/search-stream?origin=THR&destination=MHD&departure_date=2025-12-20" | head -n 5
```

**Pass Criteria**: First `provider_result` event within 5 seconds

### Metric 2: Time to Complete
**Target**: < 30 seconds

**Test**:
```bash
# Count time from start to search_complete event
time curl -N "http://localhost:8080/flights/search-stream?origin=THR&destination=MHD&departure_date=2025-12-20" > /dev/null
```

**Pass Criteria**: Total time < 30 seconds

### Metric 3: Memory Usage
**Target**: No memory leaks

**Test**:
1. Open Chrome DevTools → Performance
2. Start recording
3. Perform 5 searches
4. Check memory heap

**Pass Criteria**: Memory returns to baseline after each search

## Browser Compatibility Testing

Test on these browsers:

- ✅ Chrome (latest) - Desktop & Mobile
- ✅ Firefox (latest) - Desktop & Mobile
- ✅ Safari (latest) - Desktop & Mobile
- ✅ Edge (latest) - Desktop

**Key Checks**:
- EventSource supported
- CSS animations work
- RTL layout correct
- Touch gestures work (mobile)

## API Testing

### Test SSE Endpoint Directly

```bash
# Test with curl (shows raw SSE events)
curl -N "http://localhost:8080/flights/search-stream?origin=THR&destination=MHD&departure_date=2025-12-20"
```

**Expected Output**:
```
data: {"type":"progress","progress":{"completed":0,"total":4,...},"timestamp":"..."}

data: {"type":"provider_result","provider":"alibaba","flights":[...],"timestamp":"..."}

data: {"type":"progress","progress":{"completed":1,"total":4,...},"timestamp":"..."}

data: {"type":"provider_result","provider":"mrbilit","flights":[...],"timestamp":"..."}

...

data: {"type":"search_complete","metadata":{...},"timestamp":"..."}
```

### Test with JavaScript

```javascript
// Browser console
const eventSource = new EventSource(
  'http://localhost:8080/flights/search-stream?origin=THR&destination=MHD&departure_date=2025-12-20'
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data.type, data);
};

eventSource.onerror = (error) => {
  console.error('Error:', error);
  eventSource.close();
};
```

## Regression Testing

### Verify Existing Features Still Work

1. **Legacy Endpoint**: `/flight/[origin]/[destination]` should still work
2. **Price History**: Check price history modal still loads
3. **Flight Details**: Click on flight card, verify details page
4. **Booking**: Test booking flow (if implemented)

### Toggle Between Streaming and Traditional

```typescript
// frontend/src/components/flight-search/index.tsx
const useStreaming = false;  // Disable streaming
```

Search and verify traditional loading still works.

## Load Testing

### Simulate Multiple Concurrent Users

```bash
# Install Apache Bench
brew install apache-bench  # macOS
apt-get install apache2-utils  # Linux

# Test with 10 concurrent users
ab -n 100 -c 10 "http://localhost:8080/flights/search-stream?origin=THR&destination=MHD&departure_date=2025-12-20"
```

**Pass Criteria**:
- ✅ No server crashes
- ✅ All requests complete successfully
- ✅ Response time < 30s average

## Debugging Tips

### Check Backend Logs
```bash
# Backend logs show provider progress
cd backend && npm run start:dev

# Look for:
✅ Loaded 150 airline logos
🔍 Starting streaming search: THR → MHD
✅ alibaba: 30 flights sent to client
```

### Check Frontend Console
```javascript
// Enable verbose logging
localStorage.setItem('debug', 'true');

// Then refresh and search
// Should see detailed event logs
```

### Check Network Tab
```
Chrome DevTools → Network → Filter: EventSource
```

Should see:
- Connection established
- Multiple SSE messages received
- Connection closes cleanly after completion

### Common Issues and Solutions

**Issue**: No events received
```bash
# Check CORS settings
# Verify EventSource connection in Network tab
# Check backend logs for errors
```

**Issue**: Animations not working
```css
/* Verify animations are loaded */
/* Check browser console for CSS errors */
/* Ensure globals.css is imported */
```

**Issue**: Flights not merging
```javascript
// Check base_flight_id generation
// Verify provider names match
// Check console for merge errors
```

**Issue**: Memory leak
```javascript
// Ensure EventSource is closed on unmount
// Check useEffect cleanup functions
// Verify no circular references
```

## Acceptance Criteria Checklist

Before marking as complete, verify:

- ✅ Progressive loading works on all major routes
- ✅ Animations are smooth and professional
- ✅ No duplicate flights displayed
- ✅ Error handling works gracefully
- ✅ Mobile experience is excellent
- ✅ Performance metrics met (< 5s first result)
- ✅ No console errors or warnings
- ✅ Backend logs are clean
- ✅ Feature can be toggled on/off
- ✅ Existing features not broken
- ✅ Documentation complete
- ✅ Code is clean and well-commented

## Test Results Template

```
## Test Results - Progressive Flight Search

**Date**: 2025-12-13
**Tester**: [Your Name]
**Environment**: Development

### Test Case Results:

| Test Case | Status | Notes |
|-----------|--------|-------|
| Basic Search Flow | ✅ Pass | First results in 3.2s |
| Flight Merging | ✅ Pass | No duplicates found |
| Animations | ✅ Pass | Smooth on all browsers |
| Error Handling | ✅ Pass | Graceful degradation |
| Filtering/Sorting | ✅ Pass | Works as expected |
| Network Issues | ✅ Pass | Handles reconnection |
| Mobile | ✅ Pass | Responsive and smooth |
| Performance | ✅ Pass | < 5s first result |

### Performance Metrics:

- Time to First Result: 3.2s ✅
- Time to Complete: 14.5s ✅
- Memory Usage: Stable ✅
- Error Rate: 0% ✅

### Browser Compatibility:

- Chrome 120: ✅ Pass
- Firefox 121: ✅ Pass
- Safari 17: ✅ Pass
- Edge 120: ✅ Pass

### Issues Found:

None - All tests passed! 🎉

### Recommendations:

- Consider adding provider prioritization
- Monitor real-world performance metrics
- Implement caching for faster subsequent searches
```

## Automated Testing (Future)

### Unit Tests

```typescript
// backend/src/modules/flights/services/flight-stream.service.spec.ts
describe('FlightStreamService', () => {
  it('should stream results progressively', async () => {
    // Test stream emission
  });

  it('should merge flights correctly', () => {
    // Test merging logic
  });
});
```

### E2E Tests

```typescript
// frontend/cypress/e2e/streaming-search.cy.ts
describe('Progressive Flight Search', () => {
  it('loads results progressively', () => {
    cy.visit('/');
    cy.get('[data-testid="origin"]').type('THR');
    cy.get('[data-testid="destination"]').type('MHD');
    cy.get('[data-testid="search-button"]').click();
    
    // Verify progressive loading
    cy.get('[data-testid="progress-bar"]').should('be.visible');
    cy.get('[data-testid="flight-card"]', { timeout: 10000 })
      .should('have.length.greaterThan', 0);
  });
});
```

---

**Ready to Test!** Follow the Quick Start section to begin testing immediately. 🚀
