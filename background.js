chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.get(['dislikedWords'], function(result) {
    if (!result.dislikedWords) {
      chrome.storage.sync.set({ dislikedWords: [] });
    }
  });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getWords') {
    chrome.storage.sync.get(['dislikedWords'], function(result) {
      sendResponse({ words: result.dislikedWords || [] });
    });
    return true;
  }
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('google.com')) {
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, {
        action: 'checkImageSearch'
      }).then(response => {
        if (response && !response.isImageSearch) {
          chrome.storage.sync.get(['dislikedWords'], function(result) {
            const words = result.dislikedWords || [];
            if (words.length > 0) {
              chrome.tabs.sendMessage(tabId, {
                action: 'updateWords',
                words: words
              }).catch(() => {});
            }
          });
        }
      }).catch(() => {});
    }, 1000);
  }
}); 