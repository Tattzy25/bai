# Bridgit-AI Search Widget Development Guide

**Status:** Building the incredible search bar widget  
**Goal:** Create a lightweight, embeddable search modal that works on any static site

---

## Current Widget State

### ✅ What Already Exists
- **File:** `/public/embed.js` (321 lines)
- **Features:**
  - Floating button (56px, indigo gradient, bottom-right)
  - Fixed position overlay
  - Search modal with input field
  - Results rendering
  - Modal open/close logic
  - Keyboard support (Escape to close)

### ❌ What Needs Improvement
1. Modal UI/UX polish
2. Result click tracking
3. Loading states
4. Error handling
5. Keyboard navigation (Cmd+K)
6. Responsive design
7. Customizable theming (colors, position)
8. "Powered by Bridgit-AI" branding

---

## Architecture: Search Widget Flow

```
User on Static Site
    ↓
Sees floating button (embed.js injected)
    ↓
Clicks button or presses Cmd+K
    ↓
Modal opens with search input
    ↓
User types query
    ↓
Debounced fetch to /api/search?q=...&siteKey=...
    ↓
Edge runtime validates + checks quotas + queries Upstash
    ↓
Results returned as JSON
    ↓
Widget renders results
    ↓
User clicks result → tracks click → navigates to URL
    ↓
Analytics event logged on backend
```

---

## Current embed.js Structure (321 lines)

Let me break down what's implemented:

### Section 1: Configuration & Setup (Lines 1-50)
```javascript
// Get site key from data-site-key attribute
const siteKey = scriptTag?.getAttribute('data-site-key');

// Constants
const BRIDGIT_API = 'http://localhost:3000';
```

**Issues:**
- ❌ API URL hardcoded to localhost
- ⚠️ Should use `data-endpoint` attribute like production snippet

### Section 2: Styles (Lines 51-150)
```css
.bridgit-ai-button { /* floating button styles */ }
.bridgit-ai-modal { /* modal overlay */ }
.bridgit-ai-search-input { /* input field */ }
.bridgit-ai-results { /* results container */ }
```

**Status:** ✅ Decent but needs refinement

### Section 3: DOM Creation (Lines 151-220)
```javascript
// Inject styles
const style = document.createElement('style');
style.textContent = styles;
document.head.appendChild(style);

// Create button
const button = document.createElement('button');
// Create modal
const modal = document.createElement('div');
```

**Status:** ✅ Good structure

### Section 4: Event Handlers (Lines 221-321)
```javascript
button.addEventListener('click', () => openModal());
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    openModal();
  }
});
```

**Status:** ✅ Keyboard support works

### Section 5: Search Logic (Lines ???)
```javascript
input.addEventListener('input', debounce(async (e) => {
  const q = e.target.value;
  const res = await fetch(
    `/api/search?q=${q}&siteKey=${siteKey}`
  );
  const data = await res.json();
  renderResults(data.hits);
}));
```

**Issues:**
- ⚠️ Need to handle loading state
- ⚠️ Need to handle errors
- ⚠️ Need to track click -> selected_doc_id

---

## Widget Specification (MVP)

### Data Attributes
```html
<script 
  src="https://cdn.bridgit-ai.com/embed.js" 
  data-site-key="PUBLIC_KEY"
  data-endpoint="https://app.bridgit-ai.com/api/search"
  data-accent="#6366f1"
  data-position="bottom-right"
  defer>
</script>
```

**Attributes:**
- `data-site-key` - REQUIRED: Public key for the site
- `data-endpoint` - OPTIONAL: API endpoint (default: current origin)
- `data-accent` - OPTIONAL: Brand color (default: #6366f1)
- `data-position` - OPTIONAL: Button position (default: bottom-right)

### Visual Design

#### Button States
```
Normal:      56px circle, indigo gradient, shadow
Hover:       scale(1.05), enhanced shadow
Active:      scale(0.95)
```

#### Modal
```
- Full viewport overlay (dark semi-transparent)
- Modal box: centered, max-width 600px, rounded corners
- Input field: large, auto-focused
- Results: scrollable list (max 10 results)
- Footer: "Powered by Bridgit-AI" (optional based on plan)
```

#### Result Card
```
Title:       Bold, truncated to 2 lines
Snippet:     Gray, 140 chars, truncated
URL:         Smaller, blue, click-friendly
```

### Keyboard Shortcuts
- `Cmd+K` or `Ctrl+K` → Open search
- `Escape` → Close search
- `↓` / `↑` → Navigate results
- `Enter` → Click selected result
- `Tab` → Cycle through results

### States
1. **Empty** - No results, no query
2. **Loading** - Spinner while fetching
3. **Results** - List of results
4. **Error** - "Search temporarily unavailable"
5. **No Results** - "No pages found for..."

---

## Implementation Plan: Enhanced embed.js

### Step 1: Configuration Management
```javascript
// Parse all data attributes
const config = {
  siteKey: scriptTag?.getAttribute('data-site-key'),
  endpoint: scriptTag?.getAttribute('data-endpoint') || '/api/search',
  accent: scriptTag?.getAttribute('data-accent') || '#6366f1',
  position: scriptTag?.getAttribute('data-position') || 'bottom-right',
  branded: true, // can be toggled by API
};
```

### Step 2: Enhanced Styles (CSS Variables for Theming)
```css
:root {
  --bridgit-accent: var(--data-accent, #6366f1);
  --bridgit-position: var(--data-position, bottom-right);
  --bridgit-text-primary: #000;
  --bridgit-text-secondary: #666;
  --bridgit-bg-primary: #fff;
  --bridgit-border-color: #e5e7eb;
}

.bridgit-ai-button {
  background: linear-gradient(135deg, var(--bridgit-accent), ...);
}

.bridgit-ai-modal {
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Step 3: Result Rendering with Click Tracking
```javascript
function renderResults(hits) {
  results.innerHTML = hits.map((hit, idx) => `
    <div class="bridgit-ai-result" data-doc-id="${hit.id}" data-index="${idx}">
      <a href="${hit.metadata?.url}" class="bridgit-ai-result-content">
        <div class="bridgit-ai-result-title">${escapeHtml(hit.title)}</div>
        <div class="bridgit-ai-result-snippet">${escapeHtml(hit.body?.slice(0, 140))}</div>
        <div class="bridgit-ai-result-url">${hit.metadata?.url}</div>
      </a>
    </div>
  `).join('');

  // Track clicks
  document.querySelectorAll('.bridgit-ai-result-content').forEach(el => {
    el.addEventListener('click', (e) => {
      const result = el.closest('.bridgit-ai-result');
      const docId = result?.getAttribute('data-doc-id');
      
      // Fire analytics
      if (docId) {
        fetch(`${config.endpoint}?action=track_click&siteKey=${config.siteKey}&docId=${docId}`, {
          method: 'POST',
        }).catch(() => {}); // best-effort
      }
    });
  });
}
```

### Step 4: Loading & Error States
```javascript
function showLoading() {
  resultsContainer.innerHTML = `
    <div class="bridgit-ai-loading">
      <div class="spinner"></div>
      <p>Searching...</p>
    </div>
  `;
}

function showError() {
  resultsContainer.innerHTML = `
    <div class="bridgit-ai-error">
      <p>Search temporarily unavailable</p>
    </div>
  `;
}

function showNoResults(query) {
  resultsContainer.innerHTML = `
    <div class="bridgit-ai-empty">
      <p>No pages found for "<strong>${escapeHtml(query)}</strong>"</p>
    </div>
  `;
}
```

### Step 5: Debounced Search
```javascript
function debounce(fn, ms = 300) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), ms);
  };
}

const handleSearch = debounce(async (query) => {
  if (!query.trim()) {
    resultsContainer.innerHTML = '';
    return;
  }

  showLoading();

  try {
    const response = await fetch(
      `${config.endpoint}?q=${encodeURIComponent(query)}&siteKey=${config.siteKey}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      showError();
      return;
    }

    const data = await response.json();
    
    if (!data.hits || data.hits.length === 0) {
      showNoResults(query);
    } else {
      renderResults(data.hits);
    }
  } catch (error) {
    console.error('[Bridgit-AI] Search error:', error);
    showError();
  }
}, 300);

input.addEventListener('input', (e) => handleSearch(e.target.value));
```

### Step 6: Keyboard Navigation
```javascript
let selectedIndex = -1;

document.addEventListener('keydown', (e) => {
  if (!modalOpen) return;

  if (e.key === 'Escape') {
    closeModal();
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectNext();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectPrev();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (selectedIndex >= 0) {
      const resultLink = document.querySelectorAll('.bridgit-ai-result-content')[selectedIndex];
      resultLink?.click();
    }
  }
});

function selectNext() {
  const results = document.querySelectorAll('.bridgit-ai-result');
  if (selectedIndex < results.length - 1) {
    selectedIndex++;
  } else {
    selectedIndex = 0;
  }
  updateSelection(results);
}

function selectPrev() {
  const results = document.querySelectorAll('.bridgit-ai-result');
  if (selectedIndex > 0) {
    selectedIndex--;
  } else {
    selectedIndex = results.length - 1;
  }
  updateSelection(results);
}

function updateSelection(results) {
  results.forEach((r, i) => {
    if (i === selectedIndex) {
      r.classList.add('selected');
      r.scrollIntoView({ block: 'nearest' });
    } else {
      r.classList.remove('selected');
    }
  });
}
```

### Step 7: Responsive Design
```css
@media (max-width: 640px) {
  .bridgit-ai-modal {
    max-width: 95vw;
    width: 95vw;
  }

  .bridgit-ai-button {
    width: 48px;
    height: 48px;
    bottom: 16px;
    right: 16px;
  }
}
```

### Step 8: Branding Footer (Dynamic)
```javascript
function renderBranding() {
  // Only show "Powered by" on Free tier
  // Plan info comes from API response or site data
  if (config.branded) {
    return `
      <div class="bridgit-ai-footer">
        <a href="https://bridgit-ai.com" target="_blank">
          Powered by Bridgit-AI
        </a>
      </div>
    `;
  }
  return '';
}
```

---

## Enhanced embed.js (Complete Rewrite)

I'll create a clean, modular version:
