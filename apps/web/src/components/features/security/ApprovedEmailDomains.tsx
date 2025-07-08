'use client';

import React, { useMemo, useState } from 'react';
import { SecurityCards } from './SecurityCards';
import { Input } from '@/components/ui/inputs';
import { Button } from '@/components/ui/buttons';
import { Text } from '@/components/ui/typography';
import { Plus, Dots } from '@/components/ui/icons';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { Dropdown } from '@/components/ui/dropdown';
import {
  useGetApprovedDomains,
  useAddApprovedDomain,
  useRemoveApprovedDomain
} from '@/api/buster_rest/security/queryRequests';
import pluralize from 'pluralize';
import { useMemoizedFn } from '@/hooks';

interface ApprovedDomain {
  domain: string;
  created_at: string;
}

export const ApprovedEmailDomains = React.memo(() => {
  const { data: approvedDomains = [] } = useGetApprovedDomains();
  const { mutateAsync: removeDomain } = useRemoveApprovedDomain();

  const [isAddingDomain, setIsAddingDomain] = useState(false);

  const { openInfoMessage, openErrorMessage } = useBusterNotifications();

  const domainCount = approvedDomains.length;
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
          <Button onClick={() => setIsAddingDomain(true)} suffix={<Plus />}>
            Add domain
          </Button>
        </div>,

        // Add domain input section (when adding)
        isAddingDomain && <AddDomainInput key="add-domain" setIsAddingDomain={setIsAddingDomain} />,

        // Domain list sections
        ...approvedDomains.map((domainData) => (
          <DomainListItem
            key={domainData.domain}
            domainData={domainData}
            onRemove={handleRemoveDomain}
          />
        ))
      ].filter(Boolean),
    [countText, isAddingDomain, approvedDomains, handleRemoveDomain]
  );

  return (
    <SecurityCards
      title="Approved email domains"
      description="Anyone with an email address at these domains is allowed to sign up for this workspace"
      cards={[{ sections }]}
    />
  );
});

ApprovedEmailDomains.displayName = 'ApprovedEmailDomains';

const AddDomainInput = React.memo(
  ({ setIsAddingDomain }: { setIsAddingDomain: (isAddingDomain: boolean) => void }) => {
    const { mutateAsync: addDomain } = useAddApprovedDomain();
    const { openInfoMessage, openErrorMessage } = useBusterNotifications();

    const [newDomain, setNewDomain] = useState('');

    const handleAddDomain = useMemoizedFn(async () => {
      if (!newDomain.trim()) return;

      try {
        await addDomain({ domains: [newDomain.trim()] });
        setNewDomain('');
        setIsAddingDomain(false);
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
              setIsAddingDomain(false);
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
            setIsAddingDomain(false);
            setNewDomain('');
          }}>
          Cancel
        </Button>
      </div>
    );
  }
);

AddDomainInput.displayName = 'AddDomainInput';

interface DomainListItemProps {
  domainData: ApprovedDomain;
  onRemove: (domain: string) => Promise<void>;
}

const DomainListItem = React.memo<DomainListItemProps>(({ domainData, onRemove }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <Text className="font-medium">{domainData.domain}</Text>
        <Text variant="secondary" size="sm">
          Added {formatDate(domainData.created_at)}
        </Text>
      </div>
      <Dropdown
        items={[
          {
            label: 'Remove domain',
            value: 'remove',
            onClick: () => onRemove(domainData.domain)
          }
        ]}>
        <Button variant="ghost" size="small" prefix={<Dots />} />
      </Dropdown>
    </div>
  );
});

DomainListItem.displayName = 'DomainListItem';
