const model = "gpt-4"
const key = '4ty0OxJEPa4XFZdF6urrT3BlbkFJb6H9XYzSwryf3gKSOumH'

const systemPrompt = `You are a helpful chatbot assistant on a yacht listing website. Anwser short. 
Always try to anwser as short as possible. 
Only provide the necessary information. 
Prioritize rendering a visual image over writing more text. 
You will answer questions that customers ask about the yachts on our platform. 
For each question, I will give you the needed data taken from our database. 
If you get no data provided, just say: 'Im sorry, but it seems like we do not have a yacht with those features available.' 
If you think it is appropriate, you should render the image of the yacht or yachts in an html card. 
You do this by providing me with a list of attributes that I use to render the card. 
The template for the list is: [{imageUrl(taken from mainImg attribute in JSON)}, {yacht_name}, {price}, {year}]
 Do not render the card and image any other way then with this template list. 
 Also, if ther user is asking for more images of a yacht, you can render them with an object inside the list like {\"type\": 'images',\"img1\": '', \"img2\": '',\"img3\": ''} (provide 1-3 images, depending on how many you are given available.)
 Only provide these 3 images at attributes, not in a list!
 Anwser very concise. If the data provided is not enough to anwser, say you do not know in a polite way.
 Anwser with a list of JSON objects. Only anwser with the list of JSON objects and never anything else. 
 This is the template for your anwser: '[{\"type\": 'text', \"content\": 'some content'}, {\"type\": 'html', "imgUrl": 'url', "title": 'yacht name goes here', "price": 'price', "year": 'year'}, {\"type\": 'text', content: 'some content'},  {\"type\": 'images',\"img1\": '', \"img2\": '',\"img3\": ''} ...]'
  Every single time at the end of the list, add another list with 3 suggested next questions for the user. 
  Do not forget to add these suggested questions in a list. These 3 questions will be rendered to the user as "suggested next questions".
  Aim to only provide questions that you think you can give an anwser to from the data provided or that you can fetch new data from your vector database to anwser the question. (the data provided is data that is fetched from a a vector database with similarity search and metadata filtering, where each chunk is one yacht JSON object)
  The template is: {\"type\": 'suggested', \"content\": [question1, question2, question3]}  Add exactly 3 of them. Do not forget to close the last object with '}'. 
  If you are adding an object with suggested anwsers, the type MUST be 'suggested'. Keep in mind, the suggested question are questions that the user can submit next, he is asking us these questins, these are not questions from us to him.
Never forget to add the suggested questions, always add them!!! Keep in mind, the questions are suggested to the USER to be submitted as next questions, these are not quesions that we ask the user!
  Do not say anything before or after! Never deviate from the JSON template. 
  Never forget to wrap the message objects in a list. 
  You can only put html and text object types one after another, like it is a conversation. 
  Keep in mind, all of the text and and html objects have to then once again be wrapped in one big list. 
  When you are rendering cards, each card must be in its seperate JSON object. 
  You must be very careful to only output text that can be parsed correctly with the JSON.parse() method from javascript.
   Do not put any characters before or after the list brackets and do not put any characters inside of the brackets that will ruin the structure of the JSON list. 
   I will later parse this in my code with JSON.parse() and I do not want errors to occurr. 
   Do not put single qoutes before or after the list. The first character that you write must be '['. 
 Imagine that each new text object is a new message.
  Never render only card, always also write some text. 
If the question is not related to yachts, say you do not know anything.
 Make each individual message as short as possible.  
 Be very careful to emphasise when you are suggesting a yacht from another manufacturer or model than the requested one.
  Focus on what brand and model the user is looking for, and do not suggest other yachts (even if provided in the data) ' `



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
const OPENAI_API_KEY = "sk-" + key; // Replace with your actual API key
let vector = [];

var history = [{
  "role": "system",
  "content": systemPrompt
}]

// Function to make the OpenAI request
async function fetchOpenAIRequest(query) {
  const requestBody = {
    input: query,
    model: "text-embedding-ada-002",
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
async function fetchPineconeRequest(metadataFilters, topK) {
  // Define the query parameters
  const queryParameters = {
    vector: vector,
    topK: topK,
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

async function callOpenAIChatCompletion(userMessage, originalInnerHtml) {
  const apiUrl = 'https://api.openai.com/v1/chat/completions';
  const apiKey = "sk-" + key;



  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  history.push({ role: "user", content: userMessage })

      
    const requestData = {
      model: model,
      messages: 
        history,
        stream:true,
        temperature: 1
    };


  /* try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestData),
      stream:true
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
  } */

    document.getElementById('chat').innerHTML = document.getElementById('chat').innerHTML + `<div class = "ai-msg"><div class="loader">
    <span></span>
    <span></span>
    <span></span>
  </div></div>`
  document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;


  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestData)
    });
  
    if (response.status === 200) {
      const reader = response.body.getReader();
      let result = '';
      var final_string_json = '';
      while (true) {
        const { done, value } = await reader.read();
  
        if (done) {
          
          break;
        }
  
        result = new TextDecoder('utf-8').decode(value);
        result = result.split('\n\n')
        result.pop()

        for (var element of result) {
          const cleaned_element = element.slice(6);
         
          var new_token = JSON.parse(cleaned_element).choices[0].delta.content;
          console.log(new_token)

          if (typeof new_token === 'undefined') {
            final_string_json = removeQuotesAndBackticksIfExist(final_string_json)
            console.log(final_string_json)
            const chatJsonEnd = JSON.parse(final_string_json);
            const newMessageObject = chatJsonEnd[chatJsonEnd.length - 1];

            console.log(newMessageObject)

            document.getElementById("first-question").innerHTML = newMessageObject.content[0];
            document.getElementById("second-question").innerHTML = newMessageObject.content[1];
            document.getElementById("third-question").innerHTML = newMessageObject.content[2];

            document.getElementById("send-icon-container").style.opacity = "100%"
            document.getElementById("suggested-questions-headline").style.opacity = "100%"
            document.getElementById("input-li").style.opacity = "100%"
            document.getElementById("first-question").style.opacity = "100%"
            document.getElementById("second-question").style.opacity = "100%"
            document.getElementById("third-question").style.opacity = "100%"


            document.getElementById("chat").innerHTML = document.getElementById("chat").innerHTML.slice(0, -147) 
            console.log("done")
            history.push({role: "assistant", content: final_string_json})
            break;
          return;
        }

          final_string_json += new_token;
          
          if (new_token.includes("}")) {

            if (final_string_json.includes("suggested")) {
              continue;
            }
             
             console.log(final_string_json)
             final_string_json = removeQuotesAndBackticksIfExist(final_string_json);
              var chatJson = {};
              const lastOccurenceOfBrace = final_string_json.lastIndexOf("}");
              chatJson = JSON.parse(final_string_json.substring(0, lastOccurenceOfBrace + 1) + "]");
             
             
             const newMessageObject = chatJson[chatJson.length - 1];
             console.log(newMessageObject)

             if (newMessageObject.type == "text") {
              document.getElementById("chat").innerHTML =  originalInnerHtml + "<div class='ai-msg'> " + newMessageObject.content + "</div>" + `<div class = "ai-msg"><div class="loader">
              <span></span>
              <span></span>
              <span></span>
            </div></div>`;
            originalInnerHtml += "<div class='ai-msg'> " + newMessageObject.content + "</div>";

            } else if ((newMessageObject.type == "html")) {
              
              const imageUrl = newMessageObject.imgUrl;
              const title = newMessageObject.title;
              const price = newMessageObject.price;
              const year = newMessageObject.year;

              // Create an HTML string with dynamic values using template literals
              const yachtCardHTML = `
              <div class='card yacht-card' style='width: 13rem;'> 
                <img class='card-img-top yacht-image' src='${imageUrl}' > 
                <div class='card-body'> 
                  <h5 class='card-title'>${title}</h5> 
                  <p class='card-text'>${price}&euro;
                  <span class = "small-dot">•</span>
                  ${year} 
                  </p> 
                  <a href='#' class='btn btn-primary see-more-btn'>See more </a> 
                </div> 
              </div>
              `;
                document.getElementById("chat").innerHTML = originalInnerHtml + yachtCardHTML + `<div class = "ai-msg"><div class="loader">
              <span></span>
              <span></span>
              <span></span>
            </div></div>`;

            
              originalInnerHtml += yachtCardHTML;
              
            } else if (newMessageObject.type == "suggested") {
        
              document.getElementById("first-question").innerHTML = element.content[0];
              document.getElementById("second-question").innerHTML = element.content[1];
              document.getElementById("third-question").innerHTML = element.content[2];

              document.getElementById("chat").innerHTML = originalInnerHtml;
            } else if (newMessageObject.type == "images") {
              var innerHTML = "";
              if (newMessageObject.img1) {
                innerHTML += `<img src='${newMessageObject.img1}' class = 'single-img'>`;
              } 
              if (newMessageObject.img2) {
                innerHTML += `<img src='${newMessageObject.img2}' class = 'single-img'>`;
              }
              if (newMessageObject.img3) {
                innerHTML += `<img src='${newMessageObject.img3}' class = 'single-img'>`;
              }

              document.getElementById("chat").innerHTML = originalInnerHtml + innerHTML;
              originalInnerHtml += document.getElementById("chat").innerHTML;
            }

            setTimeout(function() {
              document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;
            }, 700)
             
          }

          

        }
        
        
        
      }

      chatJson = JSON.parse(final_string_json);
      const newMessageObject = chatJson[chatJson.length - 1];

      console.log(newMessageObject)

      document.getElementById("first-question").innerHTML = newMessageObject.content[0];
      document.getElementById("second-question").innerHTML = newMessageObject.content[1];
      document.getElementById("third-question").innerHTML = newMessageObject.content[2];

      document.getElementById("chat").innerHTML = originalInnerHtml
      
   
    } else {
      return 'Error: Failed to retrieve response from OpenAI API';
    }
  } catch (error) {
    console.log( `Error: ${error.message}`);
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


  document.getElementById("send-icon-container").style.opacity = "30%"
  document.getElementById("suggested-questions-headline").style.opacity = "30%"
  document.getElementById("input-li").style.opacity = "30%"
  document.getElementById("first-question").style.opacity = "30%"
  document.getElementById("second-question").style.opacity = "30%"
  document.getElementById("third-question").style.opacity = "30%"

  
  var fetchingDecisionQuery = ` You will be given an conversation between an AI chatbot on a yacht listing website and a human. 
  This chatbot is connected to a vector database and can fetch related data if needed.
   Your goal is to determine when to fetch the data. Respond with JSON that indicates wether to fetch more data or not. 
   Only respond with JSON, nothing else before or afer. Your first characters is "{".  
   The vector is always a complete JSON object with all info of one boat. 
   If you already have info about the boat for the next question, you do not need to fetch the JSON again. 
   If you do not need to fetch data, then also write out the response to the user. 
   If you do need to fetch data, then write out the query to the vector database that will be used for similarity vector search (cosine similarity search). 
   You can either choose to fetch "detailed" data or just general data. When you only need the general data for the response (year, price, main image url, yacht name), then set the detailed attribute to false, otherwise if you need the detailed data for the response (equipment information, interior and exterior images...), then set this detailed filter to true.
    ALWAYS provide me with the "detailed" metadata attribute value. Just set it to "detailed": true, or "detailed":false.
   Along with the similarity serch query, also generate a filter object that contains metadata filters that I will use on pinecone for filtering (for example which yacht brand the user is looking for)
   If an attribute is not mentioned in the query, do not add it to the JSON at all.
   Only generate metadata filters for pinecone.
   The available metadata filters (attributes) are:
   1.  brand (manufacturer)
   2.  year 
   3.  size (in meters)
   4.  beam (in meters)
   5.  price (in euros)
   6. detailed (false or true)
   If someone mentions the brand (manufacturer) of the yacht in the query, include the brand name in the metadata filters too, not only in the dbQuery attribute.
   Example for fetching response: {"fetch":true,"dbQuery":"Princess V53","filter":{"size":{"$eq": 10},"year":2019, "brand": {"$eq": "Fairline"}}, "detailed": true, topK: {integer in range 1-6 that indicates how many yacht results to fetch from the vector database}, "suggestedQuestions": [add three next suggested questions here]}. 
   Keep in mind, the suggested question are questions that the user can submit next, he is asking us these questins, these are not questions from us to him.
   If the manufacturer is mentioned in the query, always include the brand filter in the filter object!!!
   Common manufacturers are: Fairline, Princess, Azimut, Cranchi. When writing out the brand, be careful to write it exactly like I did, also be careful to capitalize it.
  
   dbQuery is always only a string. The metadata filters should only be present in the filter object. If you understand that the user wants to see multiple yachts, you can set the topK filter to up to 6, but if he is searching for a specific yacht, you should set the topK attribute to 1.
   Example for not fetching response: {"fetch": false, "response": "This yacht was manufactured in 2021", "suggestedQuestions": [add three next suggested questions here]} 
   There is a third option. If the user asks you for some pictures of the boat, you can anwser with:
   {"fetch": false, "response": "["<img src='{img url}' class = 'single-img'>", "<img src='{img url}' class = 'single-img'>", ...]} 
   If you do are missing urls to render the images or if you are missing any other data that the user is asking for, perform a detailed fetch.
   You will be provided image urls in the data. Only render up to three images in the response. Do not forget to wrap the images in a list. If you do not wrap the image urls in a list, my code will break, so wrap them in a list.
   Do not forget to add the suggested next questions, always keep in mind to add exactly three suggestedQuestions.
   These 3 questions will be rendered to the user as "suggested next questions".
   Aim to only provide questions that you think you can give an anwser to from the data provided or that you can fetch new data from your vector database to anwser the question. (the data provided is data that is fetched from a a vector database with similarity search and metadata filtering, where each chunk is one yacht JSON object)
   Do not deviate from the given JSON formats, always include all the attributes exactly as mentioned!
   If there are any numbers in the query, be sure to add the appropriate metadata filters.
   Never forget to add the fetch and topK properties. The fetch and topK properties are very important, do not miss adding it.
   If you are only providing the response, without fetching new data, focus on the last question in order to provide your anwser.
   Always only anwser the last submitted question by the user. If the user is asking a follow up question, do not query the data once again. Be very focused on providing the user anwsers that make sense.
   Focus the most on anwsering the last question.
   When rendering attributes inside of html elements, only use single quotes, do not use double qoutes. 
   If the question is not related to yachts, say you do not know anything.`

  var historyCopy = history;

  historyCopy.push({ role: "user", content: query })

  console.log(historyCopy)
  
  historyCopy.slice(1).forEach(function(element) {
    // Access the elements of the array using the "element" parameter

    if (element.role = "user") {
      fetchingDecisionQuery += "User: " + element.content
    } else {
      fetchingDecisionQuery += "AI: " + element.content
    }

   

  });
  
  var origin = document.getElementById("chat").innerHTML;
  document.getElementById("chat").innerHTML = document.getElementById("chat").innerHTML +  `<div class = "ai-msg"><div class="loader">
  <span></span>
  <span></span>
  <span></span>
</div></div>`;

document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;

  const apiUrl = 'https://api.openai.com/v1/chat/completions';
  const apiKey = key;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  const requestDataInitial = {
    model: model,
    messages: [
      {"role": "user", content: fetchingDecisionQuery}
    ]
  };

  
    const response2 = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestDataInitial),
    });

    
    document.getElementById("chat").innerHTML = origin;

  
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

      document.getElementById("send-icon-container").style.opacity = "100%"
      document.getElementById("suggested-questions-headline").style.opacity = "100%"
      document.getElementById("input-li").style.opacity = "100%"
      document.getElementById("first-question").style.opacity = "100%"
      document.getElementById("second-question").style.opacity = "100%"
      document.getElementById("third-question").style.opacity = "100%"

      history.push({role: "assistant", content: innerHtmlForChat})
      
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

      
      document.getElementById('chat').innerHTML = document.getElementById('chat').innerHTML + innerHtmlForChat;
      originalInnerHtml = originalInnerHtml + innerHtmlForChat;
    }

  console.log(decisionJson)

  var filters = decisionJson.filter;

  const detailed =  decisionJson.detailed;
  console.log(detailed)

  const allowedAttributes = ["year", "size", "price", "beam", "brand"];

  for (const key in filters) {
    if (!allowedAttributes.includes(key)) {
      delete filters[key];
    }
  }

  
  await fetchOpenAIRequest(decisionJson.dbQuery);
  const pineconeResult = await fetchPineconeRequest(decisionJson.filter, decisionJson.topK);


var dataPass = '';
const template = "Question: {question}. Data: {data}?";
if (pineconeResult.matches[0]) {

  if (detailed) {
    dataPass += ', ' + pineconeResult.matches[0].metadata.text;
  } else {
    console.log("UNDETAILED DATA")
    const object = pineconeResult.matches[0];
    
    dataPass += ', ' + JSON.stringify(
      {
        "yacht_name": object.metadata.yacht_name,
        "price": object.metadata.price,
        "mainImg": object.metadata.mainImg,
        "year": object.metadata.year
      }
    );
    console.log(dataPass)

  }

}

if (pineconeResult.matches[1]) {
  if (detailed) {
    dataPass += ', ' + pineconeResult.matches[1].metadata.text;
  } else {
    const object = pineconeResult.matches[1];
    dataPass += ', ' + JSON.stringify(
      {
        "yacht_name": object.metadata.yacht_name,
        "price": object.metadata.price,
        "mainImg": object.metadata.mainImg,
        "year": object.metadata.year
      }
    );
  }
} 
if (pineconeResult.matches[2]) {
  if (detailed) {
    dataPass += ', ' + pineconeResult.matches[2].metadata.text;
  } else {
    const object = pineconeResult.matches[2];
    dataPass += ', ' + JSON.stringify(
      {
        "yacht_name": object.metadata.yacht_name,
        "price": object.metadata.price,
        "mainImg": object.metadata.mainImg,
        "year": object.metadata.year
      }
    );
  }
} 
dataPass += ']'

const data = {
  question: query,
  data: dataPass,
};

const userMessage = fillTemplate(template, data);

  const response = await callOpenAIChatCompletion(userMessage, originalInnerHtml);

  /* var responseCleaned = removeQuotesAndBackticksIfExist(response)

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
  }, 700) */
  

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

  document.getElementById("first-question").innerHTML = "Fairline between 300 and 600k€?"
  document.getElementById("second-question").innerHTML = "Princess yacht 13-16m?"
  document.getElementById("third-question").innerHTML = "Galeon 430?"

  document.getElementById("send-icon-container").style.opacity = "100%"
  document.getElementById("suggested-questions-headline").style.opacity = "100%"
  document.getElementById("input-li").style.opacity = "100%"
  document.getElementById("first-question").style.opacity = "100%"
  document.getElementById("second-question").style.opacity = "100%"
  document.getElementById("third-question").style.opacity = "100%"


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

document.getElementById("second-question").addEventListener('click', secondQuestion)

document.getElementById("third-question").addEventListener('click', thirdQuestion)



function isMobileDevice() {
  const userAgent = navigator.userAgent;
  return /Mobile|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

if (isMobileDevice()) {
  // This code will run on mobile devices

  
  document.getElementById("input-li").style.marginLeft = "5px"
  /* document.getElementById("chat").style.paddingBottom = "230px" */

  console.log(production)
  if (production) {
    document.getElementById("suggested-questions").style.bottom = "66px"

    document.getElementById("chat").style.paddingBottom = "265px"

  }
  
} else {
  // This code will run on desktop devices
  console.log('This is a desktop device');
}

if (window.innerWidth > 800) {
  // Add the data-simplebar attribute if the screen width is over 800px
  document.getElementById('suggested-questions').setAttribute('data-simplebar', '');
}


// Get a reference to your input element by its ID or any other selector
const inputElement = document.getElementById('msg-input');

// Add an event listener for the "keydown" event on the input element
inputElement.addEventListener('keydown', function(event) {
  // Check if the pressed key is "Enter" (key code 13)
  if (event.key == 'Enter') {
    // Your code to execute when Enter is pressed here
    // For example, trigger a click event on a button with the id "your-button-id"
    document.getElementById('send-icon-container').click();
  }
});


document.getElementById("close-svg").addEventListener('click', function() {

  document.getElementById("header").style.display = "none";
  document.getElementById("chat").style.display = "none";
  document.getElementById("widget").style.display = "none";
  document.getElementById("footer").style.display = "none";

})

document.getElementById("opener").addEventListener('click', function() {

  document.getElementById("header").style.display = "block";
  document.getElementById("chat").style.display = "block";
  document.getElementById("widget").style.display = "flex";
  document.getElementById("footer").style.display = "flex";

})

