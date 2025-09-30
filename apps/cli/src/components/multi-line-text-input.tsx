import { Box, Text, useInput } from 'ink';
import { useEffect, useRef, useState } from 'react';

interface MultiLineTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  focus?: boolean;
}

export function MultiLineTextInput({
  value,
  onChange,
  onSubmit,
  placeholder = '',
  focus = true,
}: MultiLineTextInputProps) {
  const [cursorPosition, setCursorPosition] = useState(value.length);
  const [showCursor, setShowCursor] = useState(true);
  const [expectingNewline, setExpectingNewline] = useState(false);
  const cursorBlinkTimer = useRef<NodeJS.Timeout>();

  // Cursor blinking effect
  useEffect(() => {
    if (focus) {
      cursorBlinkTimer.current = setInterval(() => {
        setShowCursor((prev) => !prev);
      }, 500);
    } else {
      setShowCursor(false);
    }

    return () => {
      if (cursorBlinkTimer.current) {
        clearInterval(cursorBlinkTimer.current);
      }
    };
  }, [focus]);

  // Update cursor position when value changes externally (e.g., when cleared after submit)
  useEffect(() => {
    setCursorPosition(value.length);
  }, [value]);

  useInput(
    (input, key) => {
      if (!focus) return;

      // Debug: Log what we're receiving
      // console.log('Input:', input, 'Key:', key);

      // Handle backslash + n sequence for newline
      if (expectingNewline) {
        setExpectingNewline(false);
        if (input === 'n') {
          // Insert newline
          const newValue = `${value.slice(0, cursorPosition)}\n${value.slice(cursorPosition)}`;
          onChange(newValue);
          setCursorPosition(cursorPosition + 1);
          return;
        } else {
          // Not 'n', so insert the backslash we skipped and this character
          let insertText = '\\';
          if (input && !key.return && !key.escape) {
            insertText += input;
          }
          const newValue = `${value.slice(0, cursorPosition)}${insertText}${value.slice(cursorPosition)}`;
          onChange(newValue);
          setCursorPosition(cursorPosition + insertText.length);

          // If it was Enter after backslash, submit
          if (key.return) {
            onSubmit();
          }
          return;
        }
      }

      // Check for backslash to start newline sequence
      if (input === '\\') {
        setExpectingNewline(true);
        return;
      }

      // Check for Shift+Enter (some terminals send this as ESC + Enter or specific sequences)
      // In many terminals, Shift+Enter might come through as:
      // 1. Just Enter with shift flag (but ink doesn't detect this properly)
      // 2. ESC followed by Enter
      // 3. A specific escape sequence

      // ESC key handling removed - doesn't work reliably for multi-key sequences

      // Check if Control key is pressed with Enter
      if (key.return && key.ctrl) {
        // Ctrl + Enter adds a newline
        const newValue = `${value.slice(0, cursorPosition)}\n${value.slice(cursorPosition)}`;
        onChange(newValue);
        setCursorPosition(cursorPosition + 1);
        return;
      }

      // Check if Meta/Alt key is pressed with Enter
      if (key.return && key.meta) {
        // Alt/Option + Enter adds a newline
        const newValue = `${value.slice(0, cursorPosition)}\n${value.slice(cursorPosition)}`;
        onChange(newValue);
        setCursorPosition(cursorPosition + 1);
        return;
      }

      // Some terminals might send Shift+Enter as just Enter with shift=true
      // But as we saw, ink only sets shift=true for uppercase letters
      // Let's try another approach: check for a special sequence
      if (key.return && key.shift) {
        // This likely won't work but let's keep it for terminals that support it
        const newValue = `${value.slice(0, cursorPosition)}\n${value.slice(cursorPosition)}`;
        onChange(newValue);
        setCursorPosition(cursorPosition + 1);
        return;
      }

      // Handle Enter - submit (only if not modified)
      if (key.return && !key.meta && !key.shift && !key.ctrl) {
        onSubmit();
        return;
      }

      if (key.backspace || key.delete) {
        if (cursorPosition > 0) {
          const newValue = `${value.slice(0, cursorPosition - 1)}${value.slice(cursorPosition)}`;
          onChange(newValue);
          setCursorPosition(cursorPosition - 1);
        }
        return;
      }

      if (key.leftArrow) {
        setCursorPosition(Math.max(0, cursorPosition - 1));
        return;
      }

      if (key.rightArrow) {
        setCursorPosition(Math.min(value.length, cursorPosition + 1));
        return;
      }

      if (key.upArrow) {
        // Move cursor to previous line
        const lines = value.split('\n');
        let currentLineStart = 0;
        let currentLineIndex = 0;
        let positionInLine = cursorPosition;

        for (let i = 0; i < lines.length; i++) {
          const lineLength = lines[i].length + (i < lines.length - 1 ? 1 : 0); // +1 for newline except last line
          if (cursorPosition <= currentLineStart + lines[i].length) {
            currentLineIndex = i;
            positionInLine = cursorPosition - currentLineStart;
            break;
          }
          currentLineStart += lineLength;
        }

        if (currentLineIndex > 0) {
          const previousLineStart = lines
            .slice(0, currentLineIndex - 1)
            .reduce((acc, line) => acc + line.length + 1, 0);
          const previousLineLength = lines[currentLineIndex - 1].length;
          const newPosition = previousLineStart + Math.min(positionInLine, previousLineLength);
          setCursorPosition(newPosition);
        }
        return;
      }

      if (key.downArrow) {
        // Move cursor to next line
        const lines = value.split('\n');
        let currentLineStart = 0;
        let currentLineIndex = 0;
        let positionInLine = cursorPosition;

        for (let i = 0; i < lines.length; i++) {
          const lineLength = lines[i].length + (i < lines.length - 1 ? 1 : 0); // +1 for newline except last line
          if (cursorPosition <= currentLineStart + lines[i].length) {
            currentLineIndex = i;
            positionInLine = cursorPosition - currentLineStart;
            break;
          }
          currentLineStart += lineLength;
        }

        if (currentLineIndex < lines.length - 1) {
          const nextLineStart = lines
            .slice(0, currentLineIndex + 1)
            .reduce((acc, line) => acc + line.length + 1, 0);
          const nextLineLength = lines[currentLineIndex + 1].length;
          const newPosition = nextLineStart + Math.min(positionInLine, nextLineLength);
          setCursorPosition(newPosition);
        }
        return;
      }

      // Regular character input
      if (input && !key.ctrl && !key.meta) {
        const newValue = `${value.slice(0, cursorPosition)}${input}${value.slice(cursorPosition)}`;
        onChange(newValue);
        setCursorPosition(cursorPosition + input.length);
      }
    },
    { isActive: focus }
  );

  // Render the text with cursor
  const renderTextWithCursor = () => {
    // Show placeholder when empty
    if (!value) {
      if (expectingNewline) {
        // Show that we're expecting 'n' for newline
        return (
          <Box>
            <Text>\ </Text>
            <Text color="yellow">(press 'n' for newline)</Text>
          </Box>
        );
      }

      // Show placeholder with cursor in fixed position
      if (!focus) {
        return <Text dimColor>{placeholder}</Text>;
      }

      // Always reserve space for cursor to prevent shifting
      return (
        <Box>
          <Text>{showCursor ? '█' : ' '}</Text>
          <Text dimColor>{placeholder}</Text>
        </Box>
      );
    }

    const beforeCursor = value.slice(0, cursorPosition);
    const afterCursor = value.slice(cursorPosition);
    let cursorChar = showCursor && focus ? '█' : ' ';

    // Show special cursor when expecting newline
    if (expectingNewline) {
      cursorChar = '\\';
    }

    // If we're at the end of the text, just append cursor
    if (cursorPosition === value.length) {
      const textWithCursor = `${beforeCursor}${cursorChar}`;
      const lines = textWithCursor.split('\n');

      if (lines.length === 1) {
        return (
          <Box>
            <Text>{lines[0]}</Text>
            {expectingNewline && <Text color="yellow"> (press 'n' for newline)</Text>}
          </Box>
        );
      }

      return (
        <Box flexDirection="column">
          {lines.map((line, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Lines position stable during editing
            <Box key={index}>
              <Text>{line || ' '}</Text>
              {index === lines.length - 1 && expectingNewline && (
                <Text color="yellow"> (press 'n' for newline)</Text>
              )}
            </Box>
          ))}
        </Box>
      );
    }

    // Cursor is in the middle of text
    const restAfterCursor = afterCursor.slice(1);
    const textWithCursor = `${beforeCursor}${cursorChar}${restAfterCursor}`;
    const lines = textWithCursor.split('\n');

    if (lines.length === 1) {
      return (
        <Box>
          <Text>{lines[0]}</Text>
          {expectingNewline && <Text color="yellow"> (press 'n' for newline)</Text>}
        </Box>
      );
    }

    return (
      <Box flexDirection="column">
        {lines.map((line, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Lines position stable during editing
          <Text key={index}>{line || ' '}</Text>
        ))}
      </Box>
    );
  };

  return renderTextWithCursor();
}
