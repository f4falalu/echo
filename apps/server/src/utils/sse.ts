import type { PublicChatEvent } from '@buster/server-shared';

/**
 * Creates headers for Server-Sent Events response
 * @returns Headers configured for SSE
 */
export function createSSEHeaders(): Headers {
  return new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable Nginx buffering
  });
}

/**
 * Formats data as an SSE event
 * @param data The data to send
 * @param eventType Optional event type
 * @param id Optional event ID
 * @returns Formatted SSE event string
 */
export function formatSSEEvent(data: unknown, eventType?: string, id?: string): string {
  const lines: string[] = [];

  if (id) {
    lines.push(`id: ${id}`);
  }

  if (eventType) {
    lines.push(`event: ${eventType}`);
  }

  // Serialize data as JSON and split by newlines for SSE format
  const jsonData = JSON.stringify(data);
  const dataLines = jsonData.split('\n');
  for (const line of dataLines) {
    lines.push(`data: ${line}`);
  }

  // SSE events end with double newline
  return `${lines.join('\n')}\n\n`;
}

/**
 * Creates a heartbeat event to keep the connection alive
 * @returns Formatted heartbeat SSE event
 */
export function createHeartbeatEvent(): string {
  return ': heartbeat\n\n';
}

/**
 * SSE stream controller for managing the stream lifecycle
 */
export class SSEStreamController {
  private encoder = new TextEncoder();
  private controller: ReadableStreamDefaultController<Uint8Array> | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private closed = false;

  /**
   * Creates a new ReadableStream for SSE
   * @param heartbeatMs Optional heartbeat interval in milliseconds (default: 30000)
   * @returns ReadableStream for SSE responses
   */
  createStream(heartbeatMs = 30000): ReadableStream<Uint8Array> {
    return new ReadableStream<Uint8Array>({
      start: (controller) => {
        this.controller = controller;

        // Set up heartbeat to keep connection alive
        if (heartbeatMs > 0) {
          this.heartbeatInterval = setInterval(() => {
            if (!this.closed) {
              this.sendRaw(createHeartbeatEvent());
            }
          }, heartbeatMs);
        }
      },

      cancel: () => {
        this.close();
      },
    });
  }

  /**
   * Sends raw string data to the stream
   * @param data Raw string data to send
   */
  private sendRaw(data: string): void {
    if (this.controller && !this.closed) {
      try {
        this.controller.enqueue(this.encoder.encode(data));
      } catch (error) {
        console.error('Error sending SSE data:', error);
        this.close();
      }
    }
  }

  /**
   * Sends an event to the stream
   * @param event The event to send
   * @param eventType Optional event type
   * @param id Optional event ID
   */
  sendEvent<T = PublicChatEvent>(event: T, eventType?: string, id?: string): void {
    const formatted = formatSSEEvent(event, eventType, id);
    this.sendRaw(formatted);
  }

  /**
   * Sends a comment (for heartbeat or debugging)
   * @param comment The comment text
   */
  sendComment(comment: string): void {
    this.sendRaw(`: ${comment}\n\n`);
  }

  /**
   * Closes the stream and cleans up resources
   */
  close(): void {
    if (this.closed) return;

    this.closed = true;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.controller) {
      try {
        this.controller.close();
      } catch (error) {
        // Controller might already be closed
        console.warn('Error closing SSE controller:', error);
      }
      this.controller = null;
    }
  }

  /**
   * Checks if the stream is closed
   */
  isClosed(): boolean {
    return this.closed;
  }
}

/**
 * Helper function to create a simple SSE response stream
 * @param eventGenerator Async generator that yields events
 * @param heartbeatMs Optional heartbeat interval
 * @returns ReadableStream for SSE
 */
export async function* createSSEEventGenerator<T>(
  eventGenerator: AsyncGenerator<T>,
  heartbeatMs = 30000
): AsyncGenerator<string> {
  // Start with a comment to establish the connection
  yield ': connection established\n\n';

  let lastEventTime = Date.now();

  // Set up heartbeat generator
  const checkHeartbeat = () => {
    const now = Date.now();
    if (now - lastEventTime > heartbeatMs) {
      lastEventTime = now;
      return createHeartbeatEvent();
    }
    return null;
  };

  try {
    for await (const event of eventGenerator) {
      // Check if we need to send a heartbeat
      const heartbeat = checkHeartbeat();
      if (heartbeat) {
        yield heartbeat;
      }

      // Send the actual event
      yield formatSSEEvent(event);
      lastEventTime = Date.now();
    }
  } finally {
    // Send a final comment to indicate stream is closing
    yield ': stream closed\n\n';
  }
}
