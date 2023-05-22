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
import { ChariotApi } from 'chariotai';

const chariot = new ChariotApi(process.env.CHARIOT_API_KEY);

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
