import React from 'react';
import type { ThemedToken } from 'shiki';

interface LineProps {
  tokens: ThemedToken[];
  lineNumber: number;
  showLineNumber: boolean;
  animation?: string;
  animationDuration?: number;
  isNew?: boolean;
}

export const Line: React.FC<LineProps> = React.memo(
  ({ tokens, lineNumber, showLineNumber, animation, animationDuration = 700, isNew = false }) => {
    const lineStyle =
      isNew && animation && animation !== 'none'
        ? { animation: `${animation} ${animationDuration}ms ease-in-out forwards` }
        : undefined;

    return (
      <div className="line" style={lineStyle}>
        {tokens.map((token, index) => (
          <span key={index} style={{ color: token.color }}>
            {token.content}
          </span>
        ))}
      </div>
    );
  }
);

Line.displayName = 'Line';
