import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { Main } from './main';

describe('Main chat screen', () => {
  it('renders header and guidance text', () => {
    const { lastFrame } = render(<Main />);
    const output = lastFrame() ?? '';

    expect(output).toContain('BUSTER v0.3.1');
    expect(output).toContain('Your AI Data Worker.');
    expect(output).toContain('You are standing in an open terminal. An AI awaits your commands.');
    expect(output).toContain('Auto (Off) — all actions require approval · shift+tab cycles');
    expect(output).toContain('? for help');
  });
});
