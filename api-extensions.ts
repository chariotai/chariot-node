import { ChariotApi, CreateOrContinueConversation } from "./api";
const AbortController = require('abort-controller');  // includes polyfill to support older Node.js versions
const EventEmitter = require('eventemitter3'); // works in node and browser environments

// ================================================================ Types
// All possible stream events
export type ChariotStreamEvent = 'message' | 'complete' | 'error' | 'end';

// Stream listener
export type ChariotStreamListener = (data?: any) => void;

// Stream controller to be used by the caller
export interface ChariotStreamController {
    on: (event: ChariotStreamEvent, listener: ChariotStreamListener) => void;
    abort: () => void;
}

// ================================================================ Extensions
/**
 * Chariot - Interface for interacting with the Chariot API
 * @export
 * @class Chariot
 * @extends {ChariotApi}
 */
export class Chariot extends ChariotApi {

    /**
     * Use this method to stream conversations from the Chariot API. If `conversation_id` is provided, the existing conversation will be continued.  Otherwise, a new conversation will be created.  If a new conversation is created, the `conversation_id` will be returned in the response. You can use this id to continue the conversation.  The `messages` array is automatically updated for each request/response, so you don\'t need to maintain any message history locally. For more information on how to stream messages in your application, see our guide on [streaming conversations](/guides/streaming-conversations).
     * 
     * @summary Stream a conversation
     * @param {CreateOrContinueConversation} conversation 
     */
    public async streamConversation(conversation: CreateOrContinueConversation): Promise<ChariotStreamController> {
        const emitter = new EventEmitter();

        // Set stream flag
        conversation.stream = true;

        // Make POST request asynchronously (returns controller we can use to abort the request)
        const controller = await this.startConversationStream(conversation, emitter);

        // Remove listeners when the stream ends
        emitter.on('end', () => {
            setTimeout(() => {
                emitter.removeAllListeners();
            }, 0); // Allow other listeners to run before removing them
        });

        // return an object with methods to listen for events and stop the stream
        return {
            on: (event: ChariotStreamEvent, listener: ChariotStreamListener) => emitter.on(event, listener),
            abort: () => {
                controller.abort();
                emitter.emit('end');
            }
        };
    }

    // ================================================================================================================= Private
    /**
     * Starts the conversation stream by making a POST request to the Chariot API.
     * Uses isomorphic-fetch instead of axios to support all environments (Node.js and browser). Axios does not support streaming in browser env.
     */
    private async startConversationStream(conversation: CreateOrContinueConversation, emitter: any) {
        const controller = new AbortController();

        // Kick off the request asynchronously so caller can subscribe to events
        Promise.resolve().then(async () => {
            try {
                const fetch = require('isomorphic-fetch'); // makes fetch work in older node and browser environments

                // Make the POST request to the Chariot API
                const response = await fetch(`${this.basePath}/conversations`, {
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

                // In browser environments we need to use ReadableStream. For node env, we use the default stream
                if (this.isBrowserEnvironment()) {
                    await this.readBrowserStream(response, emitter);
                } else {
                    this.readNodeStream(response, emitter);
                }

            } catch (error) {
                emitter.emit('error', `Request failed: ${error}`);
                emitter.emit('end');
            }
        });

        return controller;
    }

    /**
     * Read the browser stream and emit events to the caller
     */
    private async readBrowserStream(response: any, emitter: any) {
        try {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            // Read the events as they arrive
            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    emitter.emit('end');
                    break;
                }

                // Decode the data from the stream
                const data = decoder.decode(value);

                // Handle each chunk of data and emit appropriate events
                this.handleServerSentEvent(data, emitter);
            }
        } catch (error) {
            if (error.name === 'AbortError') return; // ignore if intentionally aborted

            emitter.emit('error', `Failed to read stream: ${error}`);
            emitter.emit('end');
        }
    }

    /**
     * Read the node stream and emit events to the caller
     */
    private readNodeStream(response: any, emitter: any) {
        try {
            const eventStream = response.body;

            eventStream.on('data', (event: any) => {
                this.handleServerSentEvent(event, emitter);
            });

            eventStream.on('end', () => {
                emitter.emit('end')
            });
        } catch (error) {
            emitter.emit('error', `Failed to read stream: ${error}`);
            emitter.emit('end');
        }
    }

    /**
     * Parses the raw server-sent event from the API and emits the appropriate event
     */
    private handleServerSentEvent(event: any, emitter: any) {
        // Parse the event
        const lines = event.toString().split('\n').filter((line: string) => line.trim() !== '');

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

    /**
     * Checks if the code is running in a browser environment
     */
    private isBrowserEnvironment() {
        return typeof window !== 'undefined' && typeof window.document !==
            'undefined';
    }
}
