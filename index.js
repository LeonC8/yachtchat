

const systemPrompt = "You are a helpful chatbot assistant on a yacht listing website. Anwser short. Always try to anwser as short as possible. Only provide the necessary information. Prioritize rendering a visual image over writing more text. You will answer questions that customers ask about the yachts on our platform. For each question, I will give you the needed data taken from our database. The data will be in JSON format like, for example:\n\n{'yacht_name': 'Pershing  80', 'year': 2010, 'generator': true, 'make': 'Pershing ', 'sternThruster': true, 'taxPaid': true, 'airConditioning': true, 'propulsionType': 'Inboard', 'city': '', 'dealershipEmail': 'info@masternautika.com', 'engines': 'MTU 2400hp', 'radar': true, 'active': true, 'size': 23.98, 'fuelCapacity': 5950, 'postal_code': '', 'autopilot': true, 'heads': 3, 'folderName': '1692612104874Pershing  80', 'mainImg': 'https://firebasestorage.googleapis.com/v0/b/approved-boats.appspot.com/o/FLPZtlEmRlZwKNvtW18GJm1UQex2%2F1692612104874Pershing%20%2080%2FmainImg%2F1692612104874-8469815_20220830051948626_1_XLARGE.jpg?alt=media&token=1facb507-30f3-4f80-b573-c9cf5875e019', 'description': '2010 Pershing 80\nPershing 80 from 2010 from her first owner!\nYacht is regularly maintained and in very good condition; used only by the owner.\nLow engine and generator hours\nLayout of 3 cabins and office work space instead of 4th cabin.\nContact us for more information and to arrange a viewing.', 'dealershipName': 'Master Nautika', 'gps': true, 'hydraulicPasarelle': true, 'fuelType': 'Diesel', 'bowThruster': true, 'model': '80', 'price': 2450000, 'beam': 5.5, 'solarPanel': false, 'satTv': false, 'teakCockpit': true, 'country': 'Croatia', 'new': false} If you think it is appropriate, you should render the image of the yacht or yachts in an html card. You do this by providing me with html code that renders the card. The html template is: <div class='card yacht-card' style='width: 13rem;'> <img class='card-img-top yacht-image' src='...' > <div class='card-body'> <h5 class='card-title'>Card title</h5> <p class='card-text'> {price in euros} • {year} </p> <a href='#' class='btn btn-primary see-more-btn'>See more </a> </div> </div>. Do not render the card and image any other way then with this template html code. Anwser very concise. Anwser with a list of JSON objects. Only anwser with the list of JSON objects and never anythign else. This is the template for your anwser: '[{\"type\": 'text', \"content\": 'some content'}, {\"type\": 'html', content: 'some  html code'}, {\"type\": 'text', content: 'some content'}, ...]' Every single time at the end of the list, add another list with 3 suggested next questions for the user. Do not forget to add these suggested anwsers in a list. The template is: {\"type\": 'suggested', \"content\": ['Tell me more about the Cranchi Z35', 'What are the specifications of the Cranchi Z35?'', 'Do you have any other yachts available?']  Add exactly 3 of them. If you are adding an object with suggested anwsers, the type MUST be 'suggested'. Do not say anything before or after! Never deviate from the JSON template. Never forget to wrap the message objects in a list. You can only put html and text object types one after another, like it is a conversation. Keep in mind, all of the text and and html objects have to then once again be wrapped in one big list. When you are rendering cards, each card must be in its seperate html JSON object. You must be very careful to only output text that can be parsed correctly with the JSON.parse() method from javascript. Do not put any characters before or after the list brackets and do not put any characters inside of the brackets that will ruin the structure of the JSON list. I will later parse this in my code with JSON.parse() and I do not want errors to occurr. Do not put single qoutes before or after the list. The first character that you write must be '['. Do not put any backslashes before qoutes. NEVER put backslashes before quotes, just write normal. Imagine that each new text object is a new message. Never render only card, always also write some text. You will be given some data each and every time, but the data will not always be neccesary for your next anwser (sometimes the previous data will be sufficient, for example if the user is asking a follow up question about a boat). In cases like this, give an anwser that the user is expecting, because the user does not see the data that you were provided, it only sees the rendred messages. If the data provided is for a new boat, but the question is a follow up question to the previously discussed boat, anwser the question for the old boat and ignore the new one. Never use the backslash character ('\'). The backslash character will ruin my app so do not use it. When rendering attributes inside of html elements, only use single quotes, do not use double qoutes. If the question is not related to yachts, say you do not know anything. Make each individual message as short as possible. If you receive data about a yacht that is not exactly in the parameters that the user asked for, say 'We currently do not have a yacht that fully matches your inquiry, but here is a good alternative.' Be very careful to emphasise when you are suggesting a yacht from another manufacturer or model than the requested one. ' "

function removeQuotesAndBackticksIfExist(inputString) {

  var returnString = inputString
  // Check if the string starts and ends with single quotes
  if (inputString.startsWith("'")) {
    // Use the replace method with a regular expression to remove the quotes
    returnString = inputString.slice(1);
  }

  if (returnString.endsWith("'")) {
    returnString = returnString.slice(0, -1)
  }

  returnString = returnString.replace(/\\/g, "")

  return returnString;
  }

const API_KEY = 'a636c203-e59e-4d56-a1d8-e884ac4baf5b';
const OPENAI_API_KEY = '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'; // Replace with your actual API key
let vector = [];

var history = [{
  "role": "system",
  "content": systemPrompt
}]

// Function to make the OpenAI request
async function fetchOpenAIRequest(query) {
  const requestBody = {
    input: query,
    model: "text-embedding-ada-002"
  };

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log(data);
    console.log(data.data[0].embedding);
    vector = data.data[0].embedding;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Function to make the Pinecone request
async function fetchPineconeRequest(metadataFilters) {
  // Define the query parameters
  const queryParameters = {
    vector: vector,
    topK: 3,
    includeValues: true,
    includeMetadata: true,
    filter: metadataFilters
  };

  console.log(queryParameters)

  // Create the request URL
  const requestUrl = `https://yachtchat-995d22b.svc.gcp-starter.pinecone.io/query`;

  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Api-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queryParameters),
    });

    const result = await response.json();
    // Store the Pinecone result for later use
    return result;
  } catch (error) {
    console.error('Error executing the Pinecone query:', error);
    throw error;
  }
}

async function callOpenAIChatCompletion(userMessage) {
  const apiUrl = 'https://api.openai.com/v1/chat/completions';
  const apiKey = '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';

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  history.push({ role: "user", content: userMessage })

      
    const requestData = {
      model: 'gpt-4',
      messages: 
        history
    };


  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestData),
    });

    if (response.status === 200) {
      
      const data = await response.json();
      history.push({role: "assistant", content: data.choices[0].message.content})
      return data.choices[0].message.content;
    } else {
      return 'Error: Failed to retrieve response from OpenAI API';
    }
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

function fillTemplate(template, data) {
  let result = template;

  for (const key in data) {
    const placeholder = `{${key}}`;
    const value = data[key];
    result = result.replace(new RegExp(placeholder, 'g'), value);
  }

  return result;
}


async function callGPT() {

  var userMessageHtml = "<div class='user-msg'> " + document.getElementById("msg-input").value + "</div>";
  document.getElementById('chat').innerHTML = document.getElementById('chat').innerHTML + userMessageHtml;

  document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;


  var query = document.getElementById("msg-input").value;
  document.getElementById("msg-input").value = "";

  
  var fetchingDecisionQuery = ` You will be given an conversation between an AI chatbot on a yacht listing website and a human. 
  This chatbot is connected to a vector database and can fetch related data if needed.
   Your goal is to determine when to fetch the data. Respond with JSON that indicates wether to fetch more data or not. 
   Only respond with JSON, nothing else before or afer. Your first characters is "{".  
   The vector is always a complete JSON object with all info of one boat. 
   If you already have info about the boat for the next question, you do not need to fetch the JSON again. 
   If you do not need to fetch data, then also write out the response to the user. 
   If you do need to fetch data, then write out the query to the vector database that will be used for similarity vector search (cosine similarity search). 
   Along with the similarity serch query, also generate a filter object that contains metadata filters that I will use on pinecone for filtering.
   If an attribute is not mentioned in the query, do not add it to the JSON at all.
   Only generate metadata filters for pinecone.
   The available metadata filters (attributes) are:
   1.  year 
   2.  size (in meters)
   3.  beam (in meters)
   4.  price (in euros)
   Example for fetching response: {"fetch":true,"dbQuery":"Princess V53","filter":{"size":{"$eq": 10},"year":2019}, "suggestedQuestions": [add three next suggested questions here]}. 
   dbQuery is always only a string. The metadata filters should only be present in the filter object.
   Example for not fetching response: {"fetch": false, "response": "This yacht was manufactured in 2021", "suggestedQuestions": [add three next suggested questions here]} 
   There is a third option. If the user asks you for some pictures of the boat, you can anwser with:
   {"fetch": false, "response": "["<img src='{img url}' class = 'single-img'>", "<img src='{img url}' class = 'single-img'>", ...]} 
   You will be provided image urls in the data. Only render up to three images in the response. Take random images from the attribute otherImages, do not repeat the mainImg url.
   Do not forget to add the suggested next questions, always keep in mind to add exactly three suggestedQuestions.
   If there are any numbers in the query, be sure to add the appropriate metadata filters.
   Never forget to add the fetch property. The fetch property is very important, do not miss adding it.
   If you are only providing the response, without fetching new data, focus on the last question in order to provide your anwser.
   Always only anwser the last submitted question by the user. If the user is asking a follow up question, do not query the data once again. Be very focused on providing the user anwsers that make sense.
   Focus the most on anwsering the last question.
   When rendering attributes inside of html elements, only use single quotes, do not use double qoutes. 
   If the question is not related to yachts, say you do not know anything.`

  var historyCopy = history;
  historyCopy.push({"role": "user", "content": query})
  historyCopy.slice(1).forEach(function(element) {
    // Access the elements of the array using the "element" parameter

    if (element.role = "user") {
      fetchingDecisionQuery += "User: " + element.content
    } else {
      fetchingDecisionQuery += "AI: " + element.content
    }

  });

  const apiUrl = 'https://api.openai.com/v1/chat/completions';
  const apiKey = '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';

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  const requestDataInitial = {
    model: 'gpt-4',
    messages: [
      {"role": "user", content: fetchingDecisionQuery}
    ]
  };

  
    const response2 = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestDataInitial),
    });

  
    const dataInitial = await response2.json();
    var decision = dataInitial.choices[0].message.content

    decision = removeQuotesAndBackticksIfExist(decision);

    console.log(decision)

    const decisionJson = JSON.parse(decision)

    console.log(decisionJson)

    var originalInnerHtml = document.getElementById('chat').innerHTML;
    if (decisionJson.fetch == false) {

      var innerHtmlForChat = "<div class='ai-msg'> " + decisionJson.response + "</div>";
      if (decisionJson.response.includes("div")) {
        innerHtmlForChat = decisionJson.response;
      } else if (Array.isArray(decisionJson.response)) {
        innerHtmlForChat = ""
        for (const img of decisionJson.response) {
          innerHtmlForChat += img;
        }
      }

      document.getElementById("first-question").innerHTML = decisionJson.suggestedQuestions[0];
      document.getElementById("second-question").innerHTML = decisionJson.suggestedQuestions[1];
      document.getElementById("third-question").innerHTML = decisionJson.suggestedQuestions[2];
      
      document.getElementById('chat').innerHTML = document.getElementById('chat').innerHTML + innerHtmlForChat;
      setTimeout(function() {
        document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;
      }, 350)
    
      return 
    } else {
      var innerHtmlForChat = "<div class='ai-msg'> " + "Give me a second to search for that." + "</div> ";

      setTimeout(function() {
        document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;
      }, 300)
    
     
      setTimeout(function() {
        document.getElementById('chat').innerHTML = document.getElementById('chat').innerHTML + `<div class = "ai-msg"><div class="loader">
        <span></span>
        <span></span>
        <span></span>
    </div></div>`
    document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;
  }, 400)


      
      document.getElementById('chat').innerHTML = document.getElementById('chat').innerHTML + innerHtmlForChat;
      originalInnerHtml = originalInnerHtml + innerHtmlForChat;
    }

  console.log(decisionJson)

  var filters = decisionJson.filter;

  const allowedAttributes = ["year", "size", "price", "beam"];

  for (const key in filters) {
    if (!allowedAttributes.includes(key)) {
      delete filters[key];
    }
  }

  
  await fetchOpenAIRequest(decisionJson.dbQuery);
  const pineconeResult = await fetchPineconeRequest(decisionJson.filter);

  // Get a reference to the element you want to scroll (replace 'your-element-id' with the actual ID or selector)

  

    // If a template is passed in, the input variables are inferred automatically from the template.
    // Example usage:
const template = "Question: {question}. Data: {data}?";
const data = {
  question: query,
  data: pineconeResult.matches[0].metadata.text,
};

const userMessage = fillTemplate(template, data);

  const response = await callOpenAIChatCompletion(userMessage);

  var responseCleaned = removeQuotesAndBackticksIfExist(response)

  console.log(responseCleaned)

  const responseList = JSON.parse(responseCleaned)

  console.log(responseList)

  var innerHtmlForChat = "";
  responseList.forEach(element => {
    if (element.type == "text" && !element.content.includes("div") && !Array.isArray(element.content)) {
      innerHtmlForChat += "<div class='ai-msg'> " + element.content + "</div>";
    } else if ((element.type = "html" || element.content.includes("div")) && !Array.isArray(element.content)) {

      innerHtmlForChat += element.content
      
    } else if (element.type == "suggested" || Array.isArray(element.content)) {

      document.getElementById("first-question").innerHTML = element.content[0];
      document.getElementById("second-question").innerHTML = element.content[1];
      document.getElementById("third-question").innerHTML = element.content[2];

    }
  });

  document.getElementById('chat').innerHTML = originalInnerHtml + innerHtmlForChat;
  setTimeout(function() {
    document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;
  }, 700)
  

 }


 document.getElementById("send-icon-container").addEventListener('click', callGPT)

function clearHistory() {
  document.getElementById("chat").innerHTML = `<div class = "ai-msg"><div class="loader">
  <span></span>
  <span></span>
  <span></span>
</div></div>`;

  history = [{
    "role": "system",
    "content": systemPrompt
  }]


  setTimeout(function() {
    document.getElementById('chat').innerHTML = `<div class = "ai-msg">Hello, what yacht are you looking for?</div>`
    }, 1000)
}
document.getElementById("refresh-svg").addEventListener('click', clearHistory)

function firstQuestion() {
  var query = document.getElementById("first-question").innerHTML;
  document.getElementById("msg-input").value = query;
  callGPT()
}

function secondQuestion() {
  var query = document.getElementById("second-question").innerHTML;
  document.getElementById("msg-input").value = query;
  callGPT()
}

function thirdQuestion() {
  var query = document.getElementById("third-question").innerHTML;
  document.getElementById("msg-input").value = query;
  callGPT()
}

document.getElementById("first-question").addEventListener('click', firstQuestion)
console.log(document.getElementById("first-question"))
document.getElementById("second-question").addEventListener('click', secondQuestion)
console.log(document.getElementById("first-question"))
document.getElementById("third-question").addEventListener('click', thirdQuestion)
console.log(document.getElementById("first-question"))


function isMobileDevice() {
  const userAgent = navigator.userAgent;
  return /Mobile|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

if (isMobileDevice()) {
  // This code will run on mobile devices
  
  document.getElementById("input-li").style.marginLeft = "5px"
  document.getElementById("chat").style.paddingBottom = "176px"

} else {
  // This code will run on desktop devices
  console.log('This is a desktop device');
}

if (window.innerWidth > 800) {
  // Add the data-simplebar attribute if the screen width is over 800px
  document.getElementById('suggested-questions').setAttribute('data-simplebar', '');
}