import React from 'react';
import {
  ContextSelector,
  useContextSelector,
  createContext
} from '@fluentui/react-context-selector';
import { useCollectionAssociations } from './useCollectionAssosciations';
import { useCollectionSubscribe } from './useCollectionSubscribe';
import { useCollectionCreate } from './useCollectionCreate';

export const useCollectionIndividual = () => {
  const collectionAssociations = useCollectionAssociations();
  const createNewCollection = useCollectionCreate();

  return {
    ...collectionAssociations,
    ...createNewCollection
  };
};

const BusterCollectionIndividual = createContext<ReturnType<typeof useCollectionIndividual>>(
  {} as ReturnType<typeof useCollectionIndividual>
);

export const BusterCollectionIndividualProvider = React.memo<{
  children: React.ReactNode;
}>(({ children }) => {
  const value = useCollectionIndividual();

  return (
    <BusterCollectionIndividual.Provider value={value}>
      {children}
    </BusterCollectionIndividual.Provider>
  );
});
BusterCollectionIndividualProvider.displayName = 'BusterCollectionIndividualProvider';

export const useBusterCollectionIndividualContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useCollectionIndividual>, T>
) => useContextSelector(BusterCollectionIndividual, selector);
