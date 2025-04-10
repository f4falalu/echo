import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState, useCallback, useEffect } from 'react';
import { useAutoScroll } from './useAutoScroll';

interface Message {
  id: number;
  text: string;
  timestamp: string;
}

const AutoScrollDemo = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAutoAddEnabled, setIsAutoAddEnabled] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const { isAutoScrollEnabled, scrollToBottom, scrollToTop, enableAutoScroll, disableAutoScroll } =
    useAutoScroll(containerRef);

  const addMessage = () => {
    const newMessage: Message = {
      id: messages.length + 1,
      text: `Message ${messages.length + 1}: ${Lorem.generateSentences(1)}`,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const addManyMessages = () => {
    const newMessages: Message[] = Array.from({ length: 10 }, (_, i) => ({
      id: messages.length + i + 1,
      text: `Message ${messages.length + i + 1}: ${Lorem.generateSentences(1)}`,
      timestamp: new Date().toLocaleTimeString()
    }));
    setMessages((prev) => [...prev, ...newMessages]);
  };

  const toggleAutoAdd = useCallback(() => {
    if (isAutoAddEnabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      setIsAutoAddEnabled(false);
    } else {
      intervalRef.current = setInterval(addMessage, 1000);
      setIsAutoAddEnabled(true);
    }
  }, [isAutoAddEnabled]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="flex w-[600px] flex-col gap-4">
      <div className="flex gap-2">
        <button
          onClick={addMessage}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
          Add Message
        </button>
        <button
          onClick={addManyMessages}
          className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600">
          Add 10 Messages
        </button>
        <button
          onClick={toggleAutoAdd}
          className={`rounded px-4 py-2 text-white ${
            isAutoAddEnabled
              ? 'bg-purple-500 hover:bg-purple-600'
              : 'bg-purple-400 hover:bg-purple-500'
          }`}>
          Auto Add {isAutoAddEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">Auto-scroll:</span>
          <button
            onClick={isAutoScrollEnabled ? disableAutoScroll : enableAutoScroll}
            className={`rounded px-3 py-1 text-white ${
              isAutoScrollEnabled ? 'bg-green-500' : 'bg-red-500'
            }`}>
            {isAutoScrollEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollToTop('smooth')}
            className="rounded bg-gray-500 px-3 py-1 text-white hover:bg-gray-600">
            Scroll to Top (smooth)
          </button>
          <button
            onClick={() => scrollToTop('instant')}
            className="rounded bg-gray-500 px-3 py-1 text-white hover:bg-gray-600">
            Scroll to Top (instant)
          </button>
          <button
            onClick={() => scrollToBottom('smooth')}
            className="rounded bg-gray-500 px-3 py-1 text-white hover:bg-gray-600">
            Scroll to Bottom (smooth)
          </button>
          <button
            onClick={() => scrollToBottom('instant')}
            className="rounded bg-gray-500 px-3 py-1 text-white hover:bg-gray-600">
            Scroll to Bottom (instant)
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="h-[400px] space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-4">
        {messages.map((message) => (
          <div key={message.id} className="rounded-lg bg-gray-100 p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-semibold">Message #{message.id}</span>
              <span className="text-xs text-gray-500">{message.timestamp}</span>
            </div>
            <p className="text-sm">{message.text}</p>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-center text-gray-500">
            No messages. Click "Add Message" to start.
          </div>
        )}
      </div>
    </div>
  );
};

// Lorem ipsum generator for demo purposes
const Lorem = {
  words: [
    'lorem',
    'ipsum',
    'dolor',
    'sit',
    'amet',
    'consectetur',
    'adipiscing',
    'elit',
    'sed',
    'do',
    'eiusmod',
    'tempor',
    'incididunt',
    'ut',
    'labore',
    'et',
    'dolore',
    'magna',
    'aliqua'
  ],
  generateSentences: (count: number) => {
    const sentences = [];
    for (let i = 0; i < count; i++) {
      const wordCount = Math.floor(Math.random() * 10) + 5;
      const words = Array.from(
        { length: wordCount },
        () => Lorem.words[Math.floor(Math.random() * Lorem.words.length)]
      );
      sentences.push(words.join(' ') + '.');
    }
    return sentences.join(' ');
  }
};

const meta: Meta<typeof AutoScrollDemo> = {
  title: 'Hooks/useAutoScroll',
  component: AutoScrollDemo,
  parameters: {
    layout: 'centered'
  }
};

export default meta;
type Story = StoryObj<typeof AutoScrollDemo>;

export const Default: Story = {};
