import { useUpdateLayoutEffect } from 'ahooks';
import { useState } from 'react';

export const useAutoSetLayout = ({
  defaultSelectedLayout,
  selectedLayout
}: {
  defaultSelectedLayout: 'chat' | 'file' | 'both' | undefined;
  selectedLayout: 'chat' | 'file' | 'both' | undefined;
}): {
  isPureFile: boolean;
  isPureChat: boolean;
  setIsPureChat: (value: boolean) => void;
} => {
  const [isPureFile, setIsPureFile] = useState(defaultSelectedLayout === 'file');
  const [isPureChat, setIsPureChat] = useState(defaultSelectedLayout === 'chat');

  useUpdateLayoutEffect(() => {
    if (isPureFile === true) setIsPureFile(selectedLayout === 'file');
    if (isPureChat === true) setIsPureChat(selectedLayout === 'chat');
  }, [selectedLayout]);

  return { isPureFile, isPureChat, setIsPureChat };
};
