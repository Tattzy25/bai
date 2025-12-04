(function() {
  'use strict';
  
  // Parse configuration from script tag
  const scriptTag = document.currentScript;
  const config = {
    siteKey: scriptTag?.getAttribute('data-site-key'),
    endpoint: scriptTag?.getAttribute('data-endpoint') || '/api/search',
    accent: scriptTag?.getAttribute('data-accent') || '#6366f1',
    position: scriptTag?.getAttribute('data-position') || 'bottom-right',
  };
  
  if (!config.siteKey) {
    console.error('[Bridgit-AI] Missing data-site-key attribute');
    return;
  }
  
  // Utility: Escape HTML
  function escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
  
  // Utility: Debounce
  function debounce(fn, ms = 300) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), ms);
    };
  }
  
  // Create styles with CSS variables for theming
  const styles = `
    :root {
      --bridgit-accent: ${config.accent};
      --bridgit-text-primary: #111827;
      --bridgit-text-secondary: #6b7280;
      --bridgit-bg-primary: #ffffff;
      --bridgit-bg-secondary: #f9fafb;
      --bridgit-border-color: #e5e7eb;
    }
    
    .bridgit-ai-button {
      position: fixed;
      ${config.position === 'bottom-left' ? 'left: 24px;' : 'right: 24px;'}
      ${config.position.includes('top') ? 'top: 24px;' : 'bottom: 24px;'}
      width: 56px;
      height: 56px;
      border-radius: 28px;
      background: linear-gradient(135deg, var(--bridgit-accent) 0%, #8b5cf6 100%);
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
      z-index: 999998;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    
    .bridgit-ai-button:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.5);
    }
    
    .bridgit-ai-button:active {
      transform: scale(0.95);
    }
    
    .bridgit-ai-button svg {
      width: 24px;
      height: 24px;
      fill: white;
    }
    
    /* Modal Overlay */
    .bridgit-ai-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999999;
      display: none;
      align-items: center;
      justify-content: center;
      animation: bridgitFadeIn 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    
    .bridgit-ai-modal.open {
      display: flex;
    }
    
    @keyframes bridgitFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .bridgit-ai-modal-content {
      background: var(--bridgit-bg-primary);
      border-radius: 16px;
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: bridgitSlideUp 0.3s ease;
    }
    
    @keyframes bridgitSlideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    .bridgit-ai-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--bridgit-border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .bridgit-ai-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--bridgit-text-primary);
    }
    
    .bridgit-ai-close {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      color: var(--bridgit-text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .bridgit-ai-close:hover {
      color: var(--bridgit-text-primary);
    }
    
    .bridgit-ai-search-box {
      padding: 20px 24px;
      border-bottom: 1px solid var(--bridgit-border-color);
    }
    
    .bridgit-ai-input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid var(--bridgit-border-color);
      border-radius: 8px;
      font-size: 16px;
      outline: none;
      transition: border-color 0.2s;
      box-sizing: border-box;
      font-family: inherit;
    }
    
    .bridgit-ai-input:focus {
      border-color: var(--bridgit-accent);
    }
    
    .bridgit-ai-results {
      flex: 1;
      overflow-y: auto;
      padding: 12px 24px;
    }
    
    .bridgit-ai-result {
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid var(--bridgit-border-color);
      text-decoration: none;
      color: inherit;
      display: block;
    }
    
    .bridgit-ai-result:hover {
      background: var(--bridgit-bg-secondary);
      border-color: var(--bridgit-accent);
    }
    
    .bridgit-ai-result.selected {
      background: var(--bridgit-bg-secondary);
      border-color: var(--bridgit-accent);
    }
    
    .bridgit-ai-result-title {
      font-weight: 600;
      color: var(--bridgit-text-primary);
      margin-bottom: 4px;
      line-height: 1.4;
      white-space: normal;
    }
    
    .bridgit-ai-result-snippet {
      font-size: 14px;
      color: var(--bridgit-text-secondary);
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .bridgit-ai-result-url {
      font-size: 12px;
      color: var(--bridgit-accent);
      margin-top: 8px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .bridgit-ai-empty {
      text-align: center;
      padding: 60px 20px;
      color: var(--bridgit-text-secondary);
      font-size: 16px;
    }
    
    .bridgit-ai-loading {
      text-align: center;
      padding: 40px 20px;
      color: var(--bridgit-text-secondary);
    }
    
    .bridgit-ai-spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid var(--bridgit-border-color);
      border-top-color: var(--bridgit-accent);
      border-radius: 50%;
      animation: bridgitSpin 0.6s linear infinite;
      margin-bottom: 12px;
    }
    
    @keyframes bridgitSpin {
      to { transform: rotate(360deg); }
    }
    
    .bridgit-ai-error {
      text-align: center;
      padding: 40px 20px;
      color: #dc2626;
    }
    
    .bridgit-ai-branding {
      padding: 12px 24px;
      text-align: center;
      font-size: 12px;
      color: var(--bridgit-text-secondary);
      border-top: 1px solid var(--bridgit-border-color);
      background: var(--bridgit-bg-secondary);
    }
    
    .bridgit-ai-branding a {
      color: var(--bridgit-accent);
      text-decoration: none;
    }
    
    .bridgit-ai-branding a:hover {
      text-decoration: underline;
    }
    
    /* Scrollbar styling */
    .bridgit-ai-results::-webkit-scrollbar {
      width: 6px;
    }
    
    .bridgit-ai-results::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .bridgit-ai-results::-webkit-scrollbar-thumb {
      background: var(--bridgit-border-color);
      border-radius: 3px;
    }
    
    .bridgit-ai-results::-webkit-scrollbar-thumb:hover {
      background: var(--bridgit-text-secondary);
    }
    
    /* Responsive Design */
    @media (max-width: 640px) {
      .bridgit-ai-modal-content {
        width: 95%;
        max-height: 90vh;
      }
      
      .bridgit-ai-button {
        width: 48px;
        height: 48px;
      }
    }
  `;
  
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
  
  // Create modal HTML
  const modalHTML = `
    <div class="bridgit-ai-modal" id="bridgit-modal">
      <div class="bridgit-ai-modal-content">
        <div class="bridgit-ai-header">
          <h3>Search</h3>
          <button class="bridgit-ai-close" id="bridgit-close" aria-label="Close search">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
            </svg>
          </button>
        </div>
        <div class="bridgit-ai-search-box">
          <input 
            type="text" 
            class="bridgit-ai-input" 
            id="bridgit-input" 
            placeholder="Search..." 
            autofocus
            autocomplete="off"
          />
        </div>
        <div class="bridgit-ai-results" id="bridgit-results">
          <div class="bridgit-ai-empty">Type to search...</div>
        </div>
        <div class="bridgit-ai-branding" id="bridgit-branding" style="display:none;">
          Powered by <a href="https://bridgit-ai.com" target="_blank" rel="noopener noreferrer">Bridgit-AI</a>
        </div>
      </div>
    </div>
  `;
  
  // Create button
  const button = document.createElement('button');
  button.className = 'bridgit-ai-button';
  button.setAttribute('aria-label', 'Open search');
  button.innerHTML = `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 2a8 8 0 105.3 14.3l4.4 4.4a1 1 0 001.4-1.4l-4.4-4.4A8 8 0 0010 2zm0 2a6 6 0 110 12 6 6 0 010-12z"/>
    </svg>
  `;
  
  document.body.appendChild(button);
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Get elements
  const modal = document.getElementById('bridgit-modal');
  const closeBtn = document.getElementById('bridgit-close');
  const input = document.getElementById('bridgit-input');
  const results = document.getElementById('bridgit-results');
  const branding = document.getElementById('bridgit-branding');
  
  let selectedIndex = -1;
  
  // State
  function openModal() {
    modal.classList.add('open');
    input.focus();
  }
  
  function closeModal() {
    modal.classList.remove('open');
    selectedIndex = -1;
    clearSelection();
  }
  
  // Event listeners
  button.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  
  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Render results
  function renderResults(hits) {
    if (!hits || hits.length === 0) {
      results.innerHTML = '<div class="bridgit-ai-empty">No pages found</div>';
      return;
    }
    
    results.innerHTML = hits.map((hit, index) => `
      <a href="${escapeHtml(hit.metadata?.url || hit.url || '#')}" class="bridgit-ai-result" data-index="${index}">
        <div class="bridgit-ai-result-title">${escapeHtml(hit.title || 'Untitled')}</div>
        <div class="bridgit-ai-result-snippet">${escapeHtml((hit.body || hit.text || '').substring(0, 140))}</div>
        <div class="bridgit-ai-result-url">${escapeHtml(hit.metadata?.url || hit.url || '')}</div>
      </a>
    `).join('');
    
    // Add click tracking
    document.querySelectorAll('.bridgit-ai-result').forEach(el => {
      el.addEventListener('click', (e) => {
        const index = el.getAttribute('data-index');
        const docId = hits[index]?.id;
        // Fire and forget analytics
        if (docId) {
          fetch(`${config.endpoint}?action=track_click&siteKey=${config.siteKey}&docId=${docId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          }).catch(() => {});
        }
      });
    });
    
    selectedIndex = -1;
  }
  
  function showLoading() {
    results.innerHTML = `
      <div class="bridgit-ai-loading">
        <div class="bridgit-ai-spinner"></div>
        <p>Searching...</p>
      </div>
    `;
  }
  
  function showError(message) {
    results.innerHTML = `
      <div class="bridgit-ai-error">
        <p>${escapeHtml(message)}</p>
      </div>
    `;
  }
  
  // Search function
  const handleSearch = debounce(async (query) => {
    if (!query.trim()) {
      results.innerHTML = '<div class="bridgit-ai-empty">Type to search...</div>';
      branding.style.display = 'none';
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
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }
      
      // Show branding on Free tier
      if (data.branded || query.length > 0) {
        branding.style.display = 'block';
      }
      
      renderResults(data.hits || []);
      
    } catch (error) {
      console.error('[Bridgit-AI] Search error:', error);
      showError(error.message || 'Search unavailable');
    }
  }, 300);
  
  // Input handler
  input.addEventListener('input', (e) => {
    handleSearch(e.target.value);
  });
  
  // Keyboard navigation
  function clearSelection() {
    document.querySelectorAll('.bridgit-ai-result').forEach(r => {
      r.classList.remove('selected');
    });
  }
  
  function selectNext() {
    const resultElements = document.querySelectorAll('.bridgit-ai-result');
    if (resultElements.length === 0) return;
    
    if (selectedIndex < resultElements.length - 1) {
      selectedIndex++;
    } else {
      selectedIndex = 0;
    }
    
    clearSelection();
    resultElements[selectedIndex].classList.add('selected');
    resultElements[selectedIndex].scrollIntoView({ block: 'nearest' });
  }
  
  function selectPrev() {
    const resultElements = document.querySelectorAll('.bridgit-ai-result');
    if (resultElements.length === 0) return;
    
    if (selectedIndex > 0) {
      selectedIndex--;
    } else {
      selectedIndex = resultElements.length - 1;
    }
    
    clearSelection();
    resultElements[selectedIndex].classList.add('selected');
    resultElements[selectedIndex].scrollIntoView({ block: 'nearest' });
  }
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    const isModalOpen = modal.classList.contains('open');
    
    // Cmd+K / Ctrl+K to open
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (isModalOpen) {
        closeModal();
      } else {
        openModal();
      }
      return;
    }
    
    if (!isModalOpen) return;
    
    // Navigation within modal
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
        const resultElements = document.querySelectorAll('.bridgit-ai-result');
        resultElements[selectedIndex]?.click();
      }
    }
  });
  
})();
