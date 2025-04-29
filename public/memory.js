const memoryStorage = {
  save: function(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  load: function(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("Error loading key:", key, e);
      return null;
    }
  }
};

function updateConversationHistory(input, response, embedding, historyEmbeddings) {
  try {
    let history = memoryStorage.load("conversationHistory") || [];
    history.push({ timestamp: Date.now(), input, response });
    historyEmbeddings.push(embedding);
    memoryStorage.save("conversationHistory", history.slice(-50));
    historyEmbeddings.splice(0, historyEmbeddings.length - 3); // 최근 3개만 유지
  } catch (e) {
    console.error("대화 이력 저장 오류:", e);
  }
}

export { memoryStorage, updateConversationHistory };
