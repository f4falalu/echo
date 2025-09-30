import { Box, Text } from 'ink';
import { useEffect, useMemo, useState } from 'react';
import { type FileSearchResult, searchFiles } from '../utils/file-search';
import { FileAutocompleteDisplay } from './file-autocomplete-display';
import { MultiLineTextInput, replaceMention } from './multi-line-text-input';
import { SimpleBigText } from './simple-big-text';

export function ChatTitle() {
  return (
    <Box justifyContent="center">
      <SimpleBigText text="Buster" color="#f5f3ff" />
    </Box>
  );
}

export function ChatVersionTagline() {
  return (
    <Box justifyContent="center" marginTop={1}>
      <Text>
        <Text color="#a78bfa">BUSTER v0.3.1</Text>
        <Text color="#c4b5fd"> — Your AI Data Worker.</Text>
      </Text>
    </Box>
  );
}

export function ChatIntroText() {
  const lines = useMemo(
    () => [
      'You are standing in an open terminal. An AI awaits your commands.',
      'ENTER to send • \\n for a new line • @ to mention files',
    ],
    []
  );

  return (
    <Box flexDirection="column" alignItems="center" marginTop={1}>
      {lines.map((line) => (
        <Text key={line} color="#e0e7ff">
          {line}
        </Text>
      ))}
    </Box>
  );
}

export function ChatStatusBar() {
  return (
    <Box
      borderStyle="single"
      borderColor="#4338ca"
      paddingX={1}
      marginTop={2}
      justifyContent="space-between"
      width="100%"
    >
      <Text color="#c4b5fd">Auto (Off) — all actions require approval · shift+tab cycles</Text>
      <Text color="#c4b5fd">BUSTER Engine</Text>
    </Box>
  );
}

interface ChatInputProps {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function ChatInput({ value, placeholder, onChange, onSubmit }: ChatInputProps) {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState<number>(-1);
  const [searchResults, setSearchResults] = useState<FileSearchResult[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Handle mention changes from the input
  const handleMentionChange = (query: string | null, position: number) => {
    // Only reset selection if the query actually changed
    if (query !== mentionQuery) {
      setSelectedIndex(0);
    }
    setMentionQuery(query);
    setMentionStart(position);
    setShowAutocomplete(query !== null);
  };

  // Search for files when mention query changes
  useEffect(() => {
    if (mentionQuery !== null) {
      searchFiles(mentionQuery, { maxResults: 20 })
        .then((results) => {
          setSearchResults(results);
          // Adjust selection if it's out of bounds
          setSelectedIndex((currentIndex) => {
            if (currentIndex >= results.length && results.length > 0) {
              return results.length - 1;
            }
            return currentIndex;
          });
        })
        .catch((error) => {
          console.error('File search failed:', error);
          setSearchResults([]);
        });
    } else {
      setSearchResults([]);
    }
  }, [mentionQuery]);

  // Handle autocomplete navigation
  const handleAutocompleteNavigate = (direction: 'up' | 'down' | 'select' | 'close') => {
    const displayItems = searchResults.slice(0, 10);
    
    switch (direction) {
      case 'up':
        setSelectedIndex((prev) => Math.max(0, prev - 1));
        break;
      case 'down':
        setSelectedIndex((prev) => Math.min(displayItems.length - 1, prev + 1));
        break;
      case 'select':
        if (displayItems[selectedIndex]) {
          const file = displayItems[selectedIndex];
          if (mentionStart !== -1 && mentionQuery !== null) {
            const mentionEnd = mentionStart + mentionQuery.length + 1; // +1 for the @ symbol
            const replacement = `@${file.relativePath} `; // Always add space
            const newValue = replaceMention(value, mentionStart, mentionEnd, replacement);
            onChange(newValue);
            setShowAutocomplete(false);
            setMentionQuery(null);
            setMentionStart(-1);
          }
        }
        break;
      case 'close':
        setShowAutocomplete(false);
        setMentionQuery(null);
        setMentionStart(-1);
        break;
    }
  };

  return (
    <Box flexDirection="column">
      <Box
        borderStyle="single"
        borderColor="#4c1d95"
        paddingX={1}
        width="100%"
        flexDirection="row"
      >
        <Text color="#a855f7" bold>
          ❯{' '}
        </Text>
        <Box flexGrow={1}>
          <MultiLineTextInput
            value={value}
            onChange={onChange}
            onSubmit={onSubmit}
            onMentionChange={handleMentionChange}
            onAutocompleteNavigate={handleAutocompleteNavigate}
            placeholder={placeholder}
            isAutocompleteOpen={showAutocomplete}
          />
        </Box>
      </Box>
      {showAutocomplete && (
        <Box marginTop={0} paddingLeft={2}>
          <FileAutocompleteDisplay
            items={searchResults}
            selectedIndex={selectedIndex}
            maxDisplay={10}
          />
        </Box>
      )}
    </Box>
  );
}

export function ChatFooter() {
  return (
    <Box justifyContent="flex-start" marginTop={1}>
      <Text dimColor>? for help</Text>
    </Box>
  );
}

export interface ChatHistoryEntry {
  id: number;
  value: string;
}

interface ChatHistoryProps {
  entries: ChatHistoryEntry[];
}

export function ChatHistory({ entries }: ChatHistoryProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <Box flexDirection="column" marginTop={1} width="100%">
      {entries.map((entry) => {
        const lines = entry.value.split('\n');
        return (
          <Box key={entry.id} flexDirection="column">
            {lines.map((line, index) => (
              <Text key={`${entry.id}-line-${index}`} color="#e0e7ff">
                {index === 0 ? '❯ ' : '  '}
                {line}
              </Text>
            ))}
          </Box>
        );
      })}
    </Box>
  );
}
