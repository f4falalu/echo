import type { Sandbox } from '@buster/sandbox';

export enum SandboxContextKey {
  Sandbox = 'sandbox',
}

export type SandboxContext = {
  sandbox: Sandbox;
};
