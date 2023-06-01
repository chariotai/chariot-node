# Chariot Node.js library
The Chariot Node.js library provides convenient access to the Chariot API from applications written in Node.js.

https://www.npmjs.com/package/chariotai

# Installation
```
npm install chariotai
```

# Documentation
Full docs and api reference can be found at [chariotai.com/docs](https://chariotai.com/docs)

# Usage
To use the Chariot API, you'll need to create an api key in the [Chariot Dashboard](https://chariotai.com/dashboard/api-keys).

```javascript
import { Chariot } from 'chariotai';

const chariot = new Chariot(process.env.CHARIOT_API_KEY);

const applications = await chariot.listApplications();

console.log(applications);
```

Or without ES modules and `async`/`await`:

```javascript
const { ChariotApi } = require('chariotai');

const chariot = new ChariotApi(process.env.CHARIOT_API_KEY)

chariot.listApplications()
  .then(applications => console.log(applications))
  .catch(error => console.error(error));
```

# Streaming conversations
You can use `streamConversation()` to read the server-sent event stream from the Chariot API:

```javascript
import { Chariot } from 'chariotai';

const chariot = new Chariot(process.env.CHARIOT_API_KEY);

// If no conversation_id is provided, a new conversation will be created
const conversation = await chariot.streamConversation({
  message: message,
  application_id: 'app_MDUxZmU4'
})

// Triggered for each new message chunk
// Includes the message chunk, conversation_id, and conversation title
conversation.on('message', (message: any) => {
  console.log(message);
});

// Triggered when the stream ends successfuly
// Includes total token count and sources used by the LLM
conversation.on('complete', (data: any) => {
  console.log('Streaming completed:', data);
);

// Triggered when the stream ends (successfuly or not)
conversation.on('end', () => {
  console.log('Stream ended');
});

// Triggered when there is an error during the stream
conversation.on('error', (data: any) => {
  console.log('Error:', data);
});

// Aborts the stream and terminates the request
conversation.abort();
```

Alternatively, if you want to work with the raw server-sent event stream, you can make a POST request to the `/conversations` endpoint manually.