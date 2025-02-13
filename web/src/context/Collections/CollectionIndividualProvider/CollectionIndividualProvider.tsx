import React from 'react';
import {
  ContextSelector,
  useContextSelector,
  createContext
} from '@fluentui/react-context-selector';
import { useCollectionAssociations } from './useCollectionAssosciations';
import { useCollectionCreate } from './useCollectionCreate';
import { useCollectionUpdate } from './useCollectionUpdate';

const useCollectionIndividualMethods = () => {
  const collectionAssociations = useCollectionAssociations();
  const createNewCollection = useCollectionCreate();
  const updateCollection = useCollectionUpdate();

  return {
    ...collectionAssociations,
    ...createNewCollection,
    ...updateCollection
  };
};

const BusterCollectionIndividual = createContext<ReturnType<typeof useCollectionIndividualMethods>>(
  {} as ReturnType<typeof useCollectionIndividualMethods>
);

export const BusterCollectionIndividualProvider = React.memo<{
  children: React.ReactNode;
}>(({ children }) => {
  const value = useCollectionIndividualMethods();

  return (
    <BusterCollectionIndividual.Provider value={value}>
      {children}
    </BusterCollectionIndividual.Provider>
  );
});
BusterCollectionIndividualProvider.displayName = 'BusterCollectionIndividualProvider';

export const useBusterCollectionIndividualContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useCollectionIndividualMethods>, T>
) => useContextSelector(BusterCollectionIndividual, selector);
