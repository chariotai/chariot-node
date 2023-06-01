"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chariot = void 0;
const api_1 = require("./api");
const abort_controller_1 = require("abort-controller"); // includes polyfill to support older Node.js versions
const fetch = require('isomorphic-fetch'); // abstracts fetch so it works in node and browser environments
const EventEmitter = require('eventemitter3');
class Chariot extends api_1.ChariotApi {
    /**
     * Use this method to stream conversations from the Chariot API. If `conversation_id` is provided, the existing conversation will be continued.  Otherwise, a new conversation will be created.  If a new conversation is created, the `conversation_id` will be returned in the response. You can use this id to continue the conversation.  The `messages` array is automatically updated for each request/response, so you don\'t need to maintain any message history locally. For more information on how to stream messages in your application, see our guide on [streaming conversations](/guides/streaming-conversations).
     *
     * @summary Stream a conversation
     * @param {CreateOrContinueConversation} conversation
     */
    streamConversation(conversation) {
        return __awaiter(this, void 0, void 0, function* () {
            const emitter = new EventEmitter();
            // Set stream flag
            conversation.stream = true;
            // Make POST request asynchronously (returns controller we can use to abort the request)
            const controller = yield this.startConversationStream(conversation, emitter);
            // Remove listeners when the stream ends
            emitter.on('end', () => {
                setTimeout(() => {
                    emitter.removeAllListeners();
                }, 0); // Allow other listeners to run before removing them
            });
            // return an object with methods to listen for events and stop the stream
            return {
                on: (event, listener) => emitter.on(event, listener),
                abort: () => {
                    controller.abort();
                    emitter.emit('end');
                }
            };
        });
    }
    // ================================================================================================================= Private
    /**
     * Starts the conversation stream by making a POST request to the Chariot API.
     * Uses isomorphic-fetch instead of axios to support all environments (Node.js and browser). Axios does not support streaming in browser env.
     */
    startConversationStream(conversation, emitter) {
        return __awaiter(this, void 0, void 0, function* () {
            const controller = new abort_controller_1.AbortController();
            // Kick off the request asynchronously so caller can subscribe to events
            Promise.resolve().then(() => __awaiter(this, void 0, void 0, function* () {
                try {
                    // Make the POST request to the Chariot API
                    const response = yield fetch(`${this.basePath}/conversations`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${this.configuration.apiKey}`
                        },
                        body: JSON.stringify(conversation),
                        signal: controller.signal
                    });
                    // Handle failed request
                    if (!response.ok || !response.body) {
                        throw new Error(`POST request failed: ${response.status}`);
                    }
                    // Read the stream and emit events to the caller
                    const eventStream = response.body;
                    eventStream.on('data', (event) => {
                        console.log('emitting event', event.toString());
                        this.handleServerSentEvent(event, emitter);
                    });
                }
                catch (error) {
                    emitter.emit('error', `Request failed: ${error}`);
                    emitter.emit('end');
                }
            }));
            return controller;
        });
    }
    /**
     * Parses the raw server-sent event from the API and emits the appropriate event
     */
    handleServerSentEvent(event, emitter) {
        // Parse the event
        const lines = event.toString().split('\n').filter((line) => line.trim() !== '');
        // Extract the data object and emit to the caller
        for (const line of lines) {
            if (line.startsWith('data:')) {
                const data = JSON.parse(line.slice(5));
                // Emit appropriate event based on status
                switch (data.status) {
                    case 'STREAMING':
                        emitter.emit('message', data);
                        break;
                    case 'DONE':
                        emitter.emit('complete', data);
                        break;
                    case 'ERROR':
                        emitter.emit('error', data);
                        break;
                }
            }
        }
    }
}
exports.Chariot = Chariot;
