import { useUpdateLayoutEffect } from 'ahooks';
import { useMemo, useState } from 'react';

export const useAutoSetLayout = ({
  defaultSelectedLayout
}: {
  defaultSelectedLayout: 'chat' | 'file' | 'both' | undefined;
}) => {
  const [isPureFile, setIsPureFile] = useState(defaultSelectedLayout === 'file');
  const [isPureChat, setIsPureChat] = useState(defaultSelectedLayout === 'chat');
  const [isCollapseOpen, setIsCollapseOpen] = useState(isPureChat ? true : false);

  useUpdateLayoutEffect(() => {
    if (isPureFile === true) setIsPureFile(defaultSelectedLayout === 'file');
    if (isPureChat === true) setIsPureChat(defaultSelectedLayout === 'chat');
  }, [defaultSelectedLayout]);

  const collapseDirection: 'left' | 'right' = useMemo(() => {
    console.log(defaultSelectedLayout);
    return defaultSelectedLayout === 'file' ? 'left' : 'right';
  }, [defaultSelectedLayout]);

  return {
    isPureFile,
    isPureChat,
    setIsPureChat,
    setIsPureFile,
    collapseDirection,
    setIsCollapseOpen,
    isCollapseOpen
  };
};
