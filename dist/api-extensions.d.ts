import { ChariotApi, CreateOrContinueConversation } from "./api";
export declare type ChariotStreamEvent = 'message' | 'complete' | 'error' | 'end';
export declare type ChariotStreamListener = (data?: any) => void;
export interface ChariotStreamController {
    on: (event: ChariotStreamEvent, listener: ChariotStreamListener) => void;
    abort: () => void;
}
/**
 * Chariot - Interface for interacting with the Chariot API
 * @export
 * @class Chariot
 * @extends {ChariotApi}
 */
export declare class Chariot extends ChariotApi {
    /**
     * Use this method to stream conversations from the Chariot API. If `conversation_id` is provided, the existing conversation will be continued.  Otherwise, a new conversation will be created.  If a new conversation is created, the `conversation_id` will be returned in the response. You can use this id to continue the conversation.  The `messages` array is automatically updated for each request/response, so you don\'t need to maintain any message history locally. For more information on how to stream messages in your application, see our guide on [streaming conversations](/guides/streaming-conversations).
     *
     * @summary Stream a conversation
     * @param {CreateOrContinueConversation} conversation
     */
    streamConversation(conversation: CreateOrContinueConversation): Promise<ChariotStreamController>;
    /**
     * Starts the conversation stream by making a POST request to the Chariot API.
     * Uses isomorphic-fetch instead of axios to support all environments (Node.js and browser). Axios does not support streaming in browser env.
     */
    private startConversationStream;
    /**
     * Read the browser stream and emit events to the caller
     */
    private readBrowserStream;
    /**
     * Read the node stream and emit events to the caller
     */
    private readNodeStream;
    /**
     * Parses the raw server-sent event from the API and emits the appropriate event
     */
    private handleServerSentEvent;
    /**
     * Checks if the code is running in a browser environment
     */
    private isBrowserEnvironment;
}
