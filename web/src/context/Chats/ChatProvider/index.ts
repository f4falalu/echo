import { useChatIndividual } from './useChatIndividual';
import { useMessageIndividual } from './useMessageIndividual';

export * from './ChatProvider';

export { useChatIndividual, useMessageIndividual };

import { MOCK_CHAT } from './MOCK_CHAT';

(() => {
  const chat = MOCK_CHAT();
  console.log(chat);
})();
