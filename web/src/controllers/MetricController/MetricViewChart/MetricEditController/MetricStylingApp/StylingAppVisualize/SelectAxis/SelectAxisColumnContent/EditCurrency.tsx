import React, { useMemo } from 'react';
import { LabelAndInput } from '../../../Common/LabelAndInput';
import type { IColumnLabelFormat } from '@/components/ui/charts/interfaces/columnLabelInterfaces';
import { Select, SelectItem } from '@/components/ui/select';
import { useGetCurrencies } from '@/api/buster_rest/nextjs/currency';
import { useMemoizedFn } from '@/hooks';
import { Text } from '@/components/ui/typography';

export const EditCurrency: React.FC<{
  currency: IColumnLabelFormat['currency'];
  onUpdateColumnConfig: (columnLabelFormat: Partial<IColumnLabelFormat>) => void;
}> = React.memo(
  ({ currency, onUpdateColumnConfig }) => {
    const { data: currencies, isFetched } = useGetCurrencies({ enabled: true });

    const options: SelectItem[] = useMemo(() => {
      return (
        currencies?.map<SelectItem<string>>((currency) => ({
          label: (
            <div className="flex items-center gap-1.5 overflow-hidden">
              <div className="rounded-sm">{currency.flag}</div>
              <Text className="truncate">{currency.description}</Text>
            </div>
          ),
          value: currency.code,
          searchLabel: currency.code + ' ' + currency.description
        })) || []
      );
    }, [currencies]);

    const selectedCurrency = useMemo(() => {
      return options?.find((option) => option.value === currency);
    }, [options, currency]);

    // const onFilterOption = useMemoizedFn((input: string, option: any) => {
    //   const _option = option as (typeof options)[0];
    //   return (
    //     !!_option?.description?.toLowerCase().includes(input.toLowerCase()) ||
    //     !!_option?.value?.toLowerCase().includes(input.toLowerCase())
    //   );
    // });

    const onChange = useMemoizedFn((optionValue: string) => {
      const value = optionValue;
      onUpdateColumnConfig({ currency: value });
    });

    return (
      <LabelAndInput label="Currency">
        <div className="w-full overflow-hidden">
          <Select
            key={isFetched ? 'fetched' : 'not-fetched'}
            items={options}
            disabled={!isFetched}
            onChange={onChange}
            className="w-full!"
            //   filterOption={onFilterOption}
          />
        </div>
      </LabelAndInput>
    );
  },
  () => {
    return true;
  }
);
EditCurrency.displayName = 'EditCurrency';
