'use client';

import React, { useMemo, useState } from 'react';
import { SettingsCards } from '../settings/SettingsCard';
import { Input } from '@/components/ui/inputs';
import { Button } from '@/components/ui/buttons';
import { Text } from '@/components/ui/typography';
import { Plus, Dots, Trash } from '@/components/ui/icons';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { Dropdown } from '@/components/ui/dropdown';
import {
  useGetApprovedDomains,
  useAddApprovedDomain,
  useRemoveApprovedDomain
} from '@/api/buster_rest/security/queryRequests';
import pluralize from 'pluralize';
import { useMemoizedFn } from '@/hooks';
import { formatDate } from '@/lib/date';

interface ApprovedDomain {
  domain: string;
  created_at: string;
}

export const ApprovedEmailDomains = React.memo(() => {
  const { data: approvedDomains = [] } = useGetApprovedDomains();
  const { mutateAsync: removeDomain } = useRemoveApprovedDomain();
  const domainCount = approvedDomains.length;

  const [isEnabledAddDomain, setIsEnabledAddDomain] = useState(false);

  const { openInfoMessage, openErrorMessage } = useBusterNotifications();

  const countText = pluralize('approved email domain', domainCount, true);

  const handleRemoveDomain = useMemoizedFn(async (domain: string) => {
    try {
      await removeDomain({ domains: [domain] });
      openInfoMessage('Domain removed successfully');
    } catch (error) {
      openErrorMessage('Failed to remove domain');
    }
  });

  const sections = useMemo(
    () =>
      [
        // Header section with count and add button
        <div key="header" className="flex items-center justify-between">
          <Text>{countText}</Text>
          <Button onClick={() => setIsEnabledAddDomain(true)} suffix={<Plus />}>
            Add domain
          </Button>
        </div>,

        // Add domain input section (when adding)
        isEnabledAddDomain && (
          <AddDomainInput key="add-domain" setIsEnabledAddDomain={setIsEnabledAddDomain} />
        ),

        // Domain list sections
        ...approvedDomains.map((domainData) => (
          <DomainListItem
            key={domainData.domain}
            domainData={domainData}
            onRemove={handleRemoveDomain}
          />
        ))
      ].filter(Boolean),
    [countText, isEnabledAddDomain, approvedDomains, handleRemoveDomain]
  );

  return (
    <SettingsCards
      title="Approved email domains"
      description="Anyone with an email address at these domains is allowed to sign up for this workspace"
      cards={[{ sections }]}
    />
  );
});

ApprovedEmailDomains.displayName = 'ApprovedEmailDomains';

const AddDomainInput = React.memo(
  ({ setIsEnabledAddDomain }: { setIsEnabledAddDomain: (isEnabledAddDomain: boolean) => void }) => {
    const { mutateAsync: addDomain } = useAddApprovedDomain();
    const { openInfoMessage, openErrorMessage } = useBusterNotifications();

    const [newDomain, setNewDomain] = useState('');

    const handleAddDomain = useMemoizedFn(async () => {
      const domain = newDomain.trim();
      if (!domain) return;

      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(domain)) {
        openErrorMessage('Please enter a valid domain name');
        return;
      }
      try {
        await addDomain({ domains: [newDomain.trim()] });
        setNewDomain('');
        setIsEnabledAddDomain(false);
        openInfoMessage('Domain added successfully');
      } catch (error) {
        openErrorMessage('Failed to add domain');
      }
    });

    return (
      <div key="add-domain" className="flex items-center space-x-2">
        <Input
          className="flex-1"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          placeholder="Enter domain (e.g., company.com)"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAddDomain();
            } else if (e.key === 'Escape') {
              setIsEnabledAddDomain(false);
              setNewDomain('');
            }
          }}
          autoFocus
        />
        <Button variant="outlined" size="tall" onClick={handleAddDomain}>
          Add
        </Button>
        <Button
          size="tall"
          variant={'ghost'}
          onClick={() => {
            setIsEnabledAddDomain(false);
            setNewDomain('');
          }}>
          Cancel
        </Button>
      </div>
    );
  }
);

AddDomainInput.displayName = 'AddDomainInput';

const DomainListItem = React.memo<{
  domainData: ApprovedDomain;
  onRemove: (domain: string) => Promise<void>;
}>(({ domainData, onRemove }) => {
  const items = useMemo(
    () => [
      {
        label: 'Remove domain',
        value: 'remove',
        icon: <Trash />,
        onClick: () => onRemove(domainData.domain)
      }
    ],
    [domainData.domain, onRemove]
  );

  return (
    <div className="flex items-center justify-between">
      <div className="mr-2 flex min-w-0 flex-1 flex-col space-y-0.5">
        <Text className="font-medium" truncate>
          {domainData.domain}
        </Text>
        <Text variant="secondary" size="sm">
          Added {formatDate({ date: domainData.created_at, format: 'LL' })}
        </Text>
      </div>
      <Dropdown side="left" align="center" items={items}>
        <Button variant="ghost" prefix={<Dots />} />
      </Dropdown>
    </div>
  );
});

DomainListItem.displayName = 'DomainListItem';
