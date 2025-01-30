import { useUpdateLayoutEffect } from 'ahooks';
import { useState } from 'react';

export const useAutoSetLayout = ({
  defaultSelectedLayout
}: {
  defaultSelectedLayout: 'chat' | 'file' | 'both' | undefined;
}): {
  isPureFile: boolean;
  isPureChat: boolean;
  setIsPureChat: (value: boolean) => void;
} => {
  const [isPureFile, setIsPureFile] = useState(defaultSelectedLayout === 'file');
  const [isPureChat, setIsPureChat] = useState(defaultSelectedLayout === 'chat');

  useUpdateLayoutEffect(() => {
    if (isPureFile === true) setIsPureFile(defaultSelectedLayout === 'file');
    if (isPureChat === true) setIsPureChat(defaultSelectedLayout === 'chat');
  }, [defaultSelectedLayout]);

  return { isPureFile, isPureChat, setIsPureChat };
};
