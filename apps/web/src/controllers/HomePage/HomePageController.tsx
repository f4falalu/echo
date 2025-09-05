import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useGetUserBasicInfo } from '@/api/buster_rest/users/useGetUserInfo';
import { Title } from '@/components/ui/typography';
import { useAsyncEffect } from '@/hooks/useAsyncEffect';
import { cn } from '@/lib/classMerge';
import { getCurrentTimeInClientTimezone, initializeClientTimezone } from '@/lib/timezone';
import { NewChatInput } from './NewChatInput';
import { NewChatWarning } from './NewChatWarning';
import { useNewChatWarning } from './useNewChatWarning';

enum TimeOfDay {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  NIGHT = 'night',
}

export const HomePageController: React.FC<{
  initialValue?: string;
  autoSubmit?: boolean;
}> = ({ initialValue, autoSubmit }) => {
  const newChatWarningProps = useNewChatWarning();
  const greeting = useGreeting();
  const { showWarning } = newChatWarningProps;

  return (
    <div className={cn('flex flex-col items-center px-5 py-5 h-full')}>
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

          <NewChatInput initialValue={initialValue} autoSubmit={autoSubmit} />
        </div>
      )}
    </div>
  );
};

const useGreeting = () => {
  const user = useGetUserBasicInfo();
  const userName = user?.name;
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay | null>(null);

  // Initialize timezone detection on client mount
  useEffect(() => {
    initializeClientTimezone();
  }, []);

  useAsyncEffect(async () => {
    const now = await getCurrentTimeInClientTimezone();
    const hours = now.hour();

    let calculatedTimeOfDay: TimeOfDay;
    if (hours >= 5 && hours < 12) {
      calculatedTimeOfDay = TimeOfDay.MORNING;
    } else if (hours >= 12 && hours < 18) {
      calculatedTimeOfDay = TimeOfDay.AFTERNOON;
    } else if (hours >= 18 && hours < 22) {
      calculatedTimeOfDay = TimeOfDay.EVENING;
    } else {
      calculatedTimeOfDay = TimeOfDay.NIGHT;
    }

    setTimeOfDay(calculatedTimeOfDay);
    return undefined;
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

  return greeting;
};
