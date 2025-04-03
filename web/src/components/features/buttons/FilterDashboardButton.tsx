import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/buttons';
import { BarsFilter } from '@/components/ui/icons';
import { Dropdown, DropdownItems } from '@/components/ui/dropdown';
import { Input } from '@/components/ui/inputs';
import { MagnifierSparkle } from '@/components/ui/icons';
import { Text } from '@/components/ui/typography';
import { faker } from '@faker-js/faker';
import { cn } from '@/lib/classMerge';

const filterItems = Array.from({ length: 100 }, (_, index) => {
  const randomWord = faker.commerce.productAdjective() + ' ' + faker.commerce.productMaterial();
  return {
    label: randomWord,
    value: randomWord + index
  };
});

export const FilterDashboardButton: React.FC = React.memo(() => {
  const [filterText, setFilterText] = useState('');

  const allDropdownItems: DropdownItems = useMemo(() => {
    return [
      ...filterItems.filter((item) => item.label.toLowerCase().includes(filterText.toLowerCase()))
    ];
  }, [filterText]);

  const menuHeader = useMemo(() => {
    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-x-2 p-1">
          <Input
            placeholder="Filters..."
            autoFocus
            variant={'ghost'}
            value={filterText}
            onKeyDown={(e) => {
              //  e.preventDefault();
              e.stopPropagation();
            }}
            onChange={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setFilterText(e.target.value);
            }}
          />
        </div>
        <div className="flex border-t p-1">
          <div
            className={cn(
              'hover:bg-item-select flex w-full cursor-pointer items-center gap-x-1.5 rounded p-1',
              filterText && 'bg-item-select'
            )}>
            <span className="text-icon-color">
              <MagnifierSparkle />
            </span>
            <Text className="whitespace-nowrap" variant="default">
              AI Filter
            </Text>
            {filterText && (
              <Text truncate variant="tertiary">
                "{filterText}"
              </Text>
            )}
          </div>
        </div>
      </div>
    );
  }, [filterText]);

  return (
    <Dropdown items={allDropdownItems} menuHeader={menuHeader} menuHeaderClassName="p-0!">
      <Button variant="ghost" prefix={<BarsFilter />}>
        Filter
      </Button>
    </Dropdown>
  );
});

FilterDashboardButton.displayName = 'FilterDashboardButton';
