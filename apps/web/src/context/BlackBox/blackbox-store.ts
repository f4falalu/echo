import { Store, useStore } from '@tanstack/react-store';

export const blackboxStore = new Store(new Map<string, string>());

export const setBlackBoxMessage = (messageId: string, thought: string) => {
  blackboxStore.setState((prev) => new Map(prev).set(messageId, thought));
};

export const getBlackBoxMessage = (messageId: string) => {
  return blackboxStore.state.get(messageId);
};

export const removeBlackBoxMessage = (messageId: string) => {
  blackboxStore.setState((prev) => {
    const newState = new Map(prev);
    newState.delete(messageId);
    return newState;
  });
};

const stableSelectBlackBoxMessage = (messageId: string) => {
  return (state: Map<string, string>) => state.get(messageId);
};
export const useGetBlackBoxMessage = (messageId: string) => {
  return useStore(blackboxStore, stableSelectBlackBoxMessage(messageId));
};
