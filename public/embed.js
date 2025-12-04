(function() {
  'use strict';
  
  const BRIDGIT_API = 'http://localhost:3000';
  
  // Get site key from script tag
  const scriptTag = document.currentScript;
  const siteKey = scriptTag?.getAttribute('data-site-key');
  
  if (!siteKey) {
    console.error('[Bridgit-AI] Missing data-site-key attribute');
    return;
  }

  // Create styles
  const styles = `
    .bridgit-ai-button {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 28px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
      z-index: 999998;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }
    
    .bridgit-ai-button:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.5);
    }
    
    .bridgit-ai-button svg {
      width: 24px;
      height: 24px;
      fill: white;
    }
    
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
      animation: fadeIn 0.2s ease;
    }
    
    .bridgit-ai-modal.open {
      display: flex;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .bridgit-ai-modal-content {
      background: white;
      border-radius: 16px;
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease;
    }
    
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    .bridgit-ai-header {
      padding: 20px 24px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .bridgit-ai-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    }
    
    .bridgit-ai-close {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      color: #6b7280;
    }
    
    .bridgit-ai-search-box {
      padding: 20px 24px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .bridgit-ai-input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 16px;
      outline: none;
      transition: border-color 0.2s;
    }
    
    .bridgit-ai-input:focus {
      border-color: #6366f1;
    }
    
    .bridgit-ai-results {
      flex: 1;
      overflow-y: auto;
      padding: 16px 24px;
    }
    
    .bridgit-ai-result {
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: background 0.2s;
      border: 1px solid #e5e7eb;
    }
    
    .bridgit-ai-result:hover {
      background: #f9fafb;
    }
    
    .bridgit-ai-result-title {
      font-weight: 600;
      color: #111827;
      margin-bottom: 4px;
    }
    
    .bridgit-ai-result-snippet {
      font-size: 14px;
      color: #6b7280;
      line-height: 1.5;
    }
    
    .bridgit-ai-empty {
      text-align: center;
      padding: 40px 20px;
      color: #9ca3af;
    }
    
    .bridgit-ai-loading {
      text-align: center;
      padding: 40px 20px;
      color: #6b7280;
    }
    
    .bridgit-ai-branding {
      padding: 12px 24px;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      border-top: 1px solid #e5e7eb;
    }
    
    .bridgit-ai-branding a {
      color: #6366f1;
      text-decoration: none;
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
          <button class="bridgit-ai-close" id="bridgit-close">
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
          />
        </div>
        <div class="bridgit-ai-results" id="bridgit-results">
          <div class="bridgit-ai-empty">Type to search...</div>
        </div>
        <div class="bridgit-ai-branding" id="bridgit-branding" style="display:none;">
          Powered by <a href="https://bridgit-ai.com" target="_blank">Bridgit-AI</a>
        </div>
      </div>
    </div>
  `;
  
  // Create button
  const button = document.createElement('button');
  button.className = 'bridgit-ai-button';
  button.innerHTML = `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 2a8 8 0 105.3 14.3l4.4 4.4a1 1 0 001.4-1.4l-4.4-4.4A8 8 0 0010 2zm0 2a6 6 0 110 12 6 6 0 010-12z"/>
    </svg>
  `;
  
  document.body.appendChild(button);
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  const modal = document.getElementById('bridgit-modal');
  const closeBtn = document.getElementById('bridgit-close');
  const input = document.getElementById('bridgit-input');
  const results = document.getElementById('bridgit-results');
  const branding = document.getElementById('bridgit-branding');
  
  let searchTimeout;
  
  // Open modal
  button.addEventListener('click', () => {
    modal.classList.add('open');
    input.focus();
  });
  
  // Close modal
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('open');
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('open');
    }
  });
  
  // Search function
  async function search(query) {
    if (!query.trim()) {
      results.innerHTML = '<div class="bridgit-ai-empty">Type to search...</div>';
      branding.style.display = 'none';
      return;
    }
    
    results.innerHTML = '<div class="bridgit-ai-loading">Searching...</div>';
    
    try {
      const response = await fetch(
        `${BRIDGIT_API}/api/search?q=${encodeURIComponent(query)}&siteKey=${siteKey}`
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }
      
      if (data.poweredBy) {
        branding.style.display = 'block';
      }
      
      if (!data.results || data.results.length === 0) {
        results.innerHTML = '<div class="bridgit-ai-empty">No results found</div>';
        return;
      }
      
      results.innerHTML = data.results.map(result => `
        <a href="${result.url || '#'}" class="bridgit-ai-result" style="text-decoration: none; color: inherit; display: block;">
          <div class="bridgit-ai-result-title">${result.title || 'Untitled'}</div>
          <div class="bridgit-ai-result-snippet">${result.text?.substring(0, 150) || ''}...</div>
        </a>
      `).join('');
      
    } catch (error) {
      results.innerHTML = `<div class="bridgit-ai-empty">Error: ${error.message}</div>`;
    }
  }
  
  // Debounced search on input
  input.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      search(e.target.value);
    }, 300);
  });
  
  // Keyboard shortcut (Cmd/Ctrl + K)
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      modal.classList.add('open');
      input.focus();
    }
    
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      modal.classList.remove('open');
    }
  });
  
})();
