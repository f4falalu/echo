import type Sandbox from '@daytonaio/sdk';

export enum SandboxContextKey {
  Sandbox = 'sandbox',
}

export type SandboxContext = {
  sandbox: Sandbox;
};
