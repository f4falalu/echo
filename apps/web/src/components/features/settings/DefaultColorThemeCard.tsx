'use client';

import React from 'react';
import { SettingsCards } from './SettingsCard';
import { Text } from '@/components/ui/typography';

export const DefaultColorThemeCard = React.memo(() => {
  return (
    <SettingsCards
      cards={[
        {
          sections: [
            <div className="flex items-center justify-between space-x-4">
              <div className="flex flex-col space-y-0.5">
                <Text>Default color theme</Text>
                <Text variant="secondary" size={'xs'}>
                  Default color theme that Buster will use when creating charts
                </Text>
              </div>
              <div>PICKER</div>
            </div>
          ]
        }
      ]}
    />
  );
});

DefaultColorThemeCard.displayName = 'DefaultColorThemeCard';
