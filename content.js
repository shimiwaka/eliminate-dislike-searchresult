let dislikedWords = [];
let isObserving = false;

function isImageSearchPage() {
  const imageSearchElement = document.querySelector('div[jsname="VIftV"]');
  if (imageSearchElement) {
    const text = imageSearchElement.textContent;
    return text.includes('画像');
  }
  return false;
}

function loadDislikedWords() {
  if (isImageSearchPage()) {
    return;
  }
  
  chrome.storage.sync.get(['dislikedWords'], function(result) {
    dislikedWords = result.dislikedWords || [];
    filterSearchResults();
  });
}

function filterSearchResults() {
  if (isImageSearchPage()) {
    return;
  }
  
  const searchResults = document.querySelectorAll('div.MjjYud');
  
  searchResults.forEach(result => {
    const text = result.textContent.toLowerCase();
    const shouldHide = dislikedWords.some(word => 
      text.includes(word.toLowerCase())
    );
    
    if (shouldHide) {
      result.style.display = 'none';
    } else {
      result.style.display = '';
    }
  });
}

function startObserving() {
  if (isObserving) return;
  
  const observer = new MutationObserver(function(mutations) {
    let shouldFilter = false;
    
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList && node.classList.contains('MjjYud')) {
              shouldFilter = true;
            }
            if (node.querySelectorAll && node.querySelectorAll('div.MjjYud').length > 0) {
              shouldFilter = true;
            }
          }
        });
      }
    });
    
    if (shouldFilter) {
      setTimeout(filterSearchResults, 100);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  isObserving = true;
}

function checkForSearchResults() {
  const searchResults = document.querySelectorAll('div.MjjYud');
  if (searchResults.length > 0) {
    filterSearchResults();
  }
}

function initialize() {
  if (isImageSearchPage()) {
    return;
  }
  
  loadDislikedWords();
  startObserving();
  
  setTimeout(checkForSearchResults, 500);
  setTimeout(checkForSearchResults, 1000);
  setTimeout(checkForSearchResults, 2000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

window.addEventListener('load', function() {
  setTimeout(checkForSearchResults, 1000);
});

let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    if (isImageSearchPage()) {
      return;
    }
    setTimeout(() => {
      loadDislikedWords();
      setTimeout(checkForSearchResults, 500);
      setTimeout(checkForSearchResults, 1000);
    }, 100);
  }
}).observe(document, { subtree: true, childList: true });

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'updateWords') {
    if (isImageSearchPage()) {
      return;
    }
    dislikedWords = request.words;
    filterSearchResults();
  } else if (request.action === 'checkImageSearch') {
    sendResponse({ isImageSearch: isImageSearchPage() });
  }
}); 