let dislikedWords = [];

document.addEventListener('DOMContentLoaded', function() {
  loadWords();
  setupEventListeners();
});

function loadWords() {
  chrome.storage.sync.get(['dislikedWords'], function(result) {
    dislikedWords = result.dislikedWords || [];
    displayWords();
  });
}

function setupEventListeners() {
  document.getElementById('addWord').addEventListener('click', addWord);
  document.getElementById('newWord').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addWord();
    }
  });
}

function addWord() {
  const input = document.getElementById('newWord');
  const word = input.value.trim();
  
  if (word === '') {
    showStatus('ワードを入力してください', 'error');
    return;
  }
  
  if (dislikedWords.includes(word)) {
    showStatus('このワードは既に登録されています', 'error');
    return;
  }
  
  dislikedWords.push(word);
  saveWords();
  input.value = '';
  showStatus('ワードを追加しました', 'success');
}

function removeWord(word) {
  dislikedWords = dislikedWords.filter(w => w !== word);
  saveWords();
  showStatus('ワードを削除しました', 'success');
}

function saveWords() {
  chrome.storage.sync.set({ dislikedWords: dislikedWords }, function() {
    displayWords();
    updateContentScript();
  });
}

function displayWords() {
  const wordList = document.getElementById('wordList');
  
  if (dislikedWords.length === 0) {
    wordList.innerHTML = '<div style="color: #666; text-align: center;">ワードが登録されていません</div>';
    return;
  }
  
  wordList.innerHTML = '';
  dislikedWords.forEach(word => {
    const wordItem = document.createElement('div');
    wordItem.className = 'word-item';
    
    const wordText = document.createElement('span');
    wordText.textContent = word;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '削除';
    deleteBtn.addEventListener('click', () => removeWord(word));
    
    wordItem.appendChild(wordText);
    wordItem.appendChild(deleteBtn);
    wordList.appendChild(wordItem);
  });
}

function updateContentScript() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs[0] && tabs[0].url.includes('google.com')) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'updateWords',
        words: dislikedWords
      }).catch(() => {
        setTimeout(() => {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'updateWords',
            words: dislikedWords
          });
        }, 1000);
      });
    }
  });
  
  chrome.tabs.query({ url: "https://www.google.com/*" }, function(tabs) {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'updateWords',
        words: dislikedWords
      }).catch(() => {});
    });
  });
}

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = 'block';
  
  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
} 