'use client';

import type React from 'react';
import { useMemo } from 'react';
import { Title } from '@/components/ui/typography';
import { useUserConfigContextSelector } from '@/context/Users';
import { NewChatInput } from './NewChatInput';
import { NewChatWarning } from './NewChatWarning';
import { useNewChatWarning } from './useNewChatWarning';

enum TimeOfDay {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  NIGHT = 'night'
}

export const HomePageController: React.FC<Record<string, never>> = () => {
  const newChatWarningProps = useNewChatWarning();
  const { showWarning } = newChatWarningProps;

  const user = useUserConfigContextSelector((state) => state.user);
  const userName = user?.name;

  const timeOfDay = useMemo(() => {
    const now = new Date();
    const hours = now.getHours();

    if (hours >= 5 && hours < 12) {
      return TimeOfDay.MORNING;
    } else if (hours >= 12 && hours < 17) {
      return TimeOfDay.AFTERNOON;
    } else if (hours >= 17 && hours < 21) {
      return TimeOfDay.EVENING;
    } else {
      return TimeOfDay.NIGHT;
    }
  }, []);

  const greeting = useMemo(() => {
    switch (timeOfDay) {
      case TimeOfDay.MORNING:
        return `Good morning, ${userName}`;
      case TimeOfDay.AFTERNOON:
        return `Good afternoon, ${userName}`;
      case TimeOfDay.EVENING:
        return `Good evening, ${userName}`;
      case TimeOfDay.NIGHT:
        return `Good night, ${userName}`;
      default:
        return `Hello, ${userName}`;
    }
  }, [timeOfDay, userName]);

  return (
    <div className="flex flex-col items-center justify-center p-4.5">
      {showWarning ? (
        <div className="mt-18 flex w-full max-w-[650px] flex-col space-y-6">
          <NewChatWarning {...newChatWarningProps} />
        </div>
      ) : (
        <div className="mt-[150px] flex w-full max-w-[650px] flex-col space-y-6">
          <div className="flex flex-col justify-center gap-y-1 text-center">
            <Title as="h1" className="mb-0!">
              {greeting}
            </Title>
            <Title as="h2" variant={'secondary'} className="mb-0! text-4xl!">
              How can I help you today?
            </Title>
          </div>

          <NewChatInput />
        </div>
      )}
    </div>
  );
};
