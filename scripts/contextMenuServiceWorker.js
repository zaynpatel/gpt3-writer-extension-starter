chrome.contextMenus.create({
  id: 'context-run',
  title: 'Generate blog post',
  contexts: ['selection'],
});

const getKey = () => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['openai-key'], (result) => {
        if (result['openai-key']) {
          const decodedKey = atob(result['openai-key']);
          resolve(decodedKey);
        }
      });
    });
  };

const sendMessage = (content) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0].id;

    chrome.tabs.sendMessage(
      activeTab,
      { message: 'inject', content },
      (response) => {
        if (response.status === 'failed') {
          console.log('injection failed.');
        } else {
          console.log("response is" + response.status)
        }
      }
    );
  });
};

const generate = async (prompt) => {
  
  const key = await getKey();
  const url = 'https://api.openai.com/v1/completions';

  const completionResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'text-davinci-002',
      prompt: prompt,
      max_tokens: 1250,
      temperature: 0.7,
    }),
  });


  const completion = await completionResponse.json();
  return completion.choices.pop();
}


const generateCompletionAction = async (info) => {
             try {
        sendMessage('generating...');
        const { selectionText } = info;
        const basePromptPrefix = `
        Write a story with two fictional characters, Jack and Jill, explaining, in depth and detail, the concept below.  Explain it with a good story and show that the writer researched well. 

        Concept:
        `
        ;

        const baseCompletion = await generate(`${basePromptPrefix}${selectionText}`);
        
        const secondPrompt = 
        ` Take the concept inputted below and give me the history of it. Tell me why it's important, what it does, and the components that make it special
          
          Concept: ${selectionText}

          Explanation: ${baseCompletion.text}

          Output:
        `
        const secondPromptCompletion = await generate(secondPrompt);

        
        
        
        sendMessage(secondPromptCompletion.text);
        console.log(secondPromptCompletion.text)

    }  catch (error) {
        console.log(error);
        sendMessage(error.toString());
    }
};

/* 
chrome.contextMenus.create({
  id: 'context-run',
  title: 'Generate blog post',
  contexts: ['selection'],
});
*/ 

chrome.contextMenus.onClicked.addListener(generateCompletionAction);
