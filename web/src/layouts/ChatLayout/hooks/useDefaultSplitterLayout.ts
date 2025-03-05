import { useMemo } from 'react';

export const useDefaultSplitterLayout = ({
  selectedLayout
}: {
  selectedLayout: 'chat' | 'file' | 'both';
}) => {
  const defaultSplitterLayout = useMemo(() => {
    if (selectedLayout === 'chat') return ['100%', '0%'];
    if (selectedLayout === 'file') return ['0%', '100%'];
    return ['325px', 'auto'];
  }, [selectedLayout]);

  return defaultSplitterLayout;
};
