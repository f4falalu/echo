import { useMemo } from 'react';

export const useDefaultSplitterLayout = ({
  defaultSelectedLayout
}: {
  defaultSelectedLayout: 'chat' | 'file' | 'both';
}) => {
  const defaultSplitterLayout = useMemo(() => {
    if (defaultSelectedLayout === 'chat') return ['100%', '0%'];
    if (defaultSelectedLayout === 'file') return ['0%', '100%'];
    return ['325px', 'auto'];
  }, [defaultSelectedLayout]);

  return defaultSplitterLayout;
};
