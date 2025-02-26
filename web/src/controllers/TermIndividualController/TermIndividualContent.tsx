'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AppContent } from '@/components/ui/layout/AppContent';
import { useBusterTermsIndividualContextSelector, useBusterTermsIndividual } from '@/context/Terms';
import { Dropdown, Input } from 'antd';
import { useDebounceFn } from 'ahooks';
import { formatDate } from '@/lib';
import { AppMaterialIcons, EditableTitle } from '@/components/ui';
import { useAntToken } from '@/styles/useAntToken';
import { AppCodeEditor } from '@/components/ui/inputs/AppCodeEditor';
import clamp from 'lodash/clamp';
import { MenuProps } from 'antd/lib';
import { Text } from '@/components/ui';
import { BusterRoutes } from '@/routes';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card/CardBase';

export const TermIndividualContent: React.FC<{
  termId: string;
}> = ({ termId }) => {
  const updateTerm = useBusterTermsIndividualContextSelector((x) => x.updateTerm);
  const { term: selectedTerm } = useBusterTermsIndividual({ termId });
  const loadingSelectedTerm = !selectedTerm?.id;

  const [editingTermName, setEditingTermName] = useState(false);
  const [termName, setTermName] = useState(selectedTerm?.name || '');
  const [termDefinition, setTermDefinition] = useState(selectedTerm?.definition || '');
  const [termSQL, setTermSQL] = useState(selectedTerm?.sql_snippet || '');
  const [sqlHeight, setSqlHeight] = useState(300);

  const onSetTermName = (value: string) => {
    setTermName(value);
    updateTerm({
      id: termId,
      name: value
    });
  };

  const onSetTermDefinition = (value: string) => {
    setTermDefinition(value);
    updateTerm({
      id: termId,
      definition: value
    });
  };

  const onSetTermSQL = useDebounceFn(
    (value: string) => {
      setTermSQL(value);
      updateTerm({
        id: termId,
        sql_snippet: value
      });
    },
    { wait: 500 }
  );

  useEffect(() => {
    setTermName(selectedTerm?.name || '');
    setTermDefinition(selectedTerm?.definition || '');
    setTermSQL(selectedTerm?.sql_snippet || '');
  }, [selectedTerm?.name, selectedTerm?.definition]);

  return (
    <AppContent className="overflow-auto p-8">
      {loadingSelectedTerm ? (
        <SkeletonLoader />
      ) : (
        <div className="flex flex-col">
          <div className="flex justify-between space-x-3">
            <div className="mb-5 flex flex-col space-y-0.5">
              <div className={'overflow-hidden'}>
                <EditableTitle
                  editing={editingTermName}
                  onEdit={setEditingTermName}
                  onChange={(v) => {
                    onSetTermName(v);
                  }}
                  level={4}>
                  {termName}
                </EditableTitle>
              </div>
              <div>
                <Text type="secondary">
                  Last updated:{' '}
                  {formatDate({
                    date: selectedTerm?.updated_at!,
                    format: 'lll'
                  })}
                </Text>
              </div>
            </div>

            <div>
              <MoreDropdown termId={termId} setEditingTermName={setEditingTermName} />
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <ItemContainer title="Definition">
              <div className={'overflow-hidden'}>
                <Input.TextArea
                  key={selectedTerm?.id || 'default'}
                  defaultValue={selectedTerm?.definition || termDefinition}
                  autoSize={{ minRows: 3, maxRows: 20 }}
                  placeholder={'Enter definition...'}
                  onBlur={(e) => {
                    onSetTermDefinition(e.target.value);
                  }}
                  variant="borderless"
                />
              </div>
            </ItemContainer>

            <ItemContainer
              title={
                <div className="flex w-full items-center justify-between space-x-2">
                  <Text>SQL Snippet</Text>

                  <AppMaterialIcons className="cursor-pointer" size={18} icon="help" />
                </div>
              }>
              <div className="relative h-full w-full" style={{ height: sqlHeight }}>
                <AppCodeEditor
                  style={{ minHeight: sqlHeight }}
                  defaultValue={termSQL}
                  onChangeEditorHeight={(v) => {
                    setSqlHeight(clamp(v, 300, 800));
                  }}
                  onChange={(v) => {
                    onSetTermSQL.run(v);
                  }}
                  monacoEditorOptions={{
                    scrollbar: {
                      alwaysConsumeMouseWheel: false
                    }
                  }}
                />
              </div>
            </ItemContainer>
          </div>
        </div>
      )}
    </AppContent>
  );
};

const SkeletonLoader: React.FC = () => {
  return <div className="p-4">{/* <Skeleton /> */}</div>;
};

const MoreDropdown: React.FC<{ termId: string; setEditingTermName: (value: boolean) => void }> = ({
  termId,
  setEditingTermName
}) => {
  const token = useAntToken();
  const onDeleteTerm = useBusterTermsIndividualContextSelector((x) => x.onDeleteTerm);
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);

  const onDeleteTermsPreflight = async () => {
    await onDeleteTerm({ ids: [termId] })
      .then(() => {
        onChangePage({
          route: BusterRoutes.APP_TERMS
        });
      })
      .catch((error) => {
        //
      });
  };

  const dropdownItems: MenuProps['items'] = useMemo(
    () => [
      {
        key: 'edit',
        icon: <AppMaterialIcons size={14} icon="edit" />,
        label: 'Edit term title',
        onClick: () => {
          setEditingTermName(true);
        }
      },
      {
        key: 'delete',
        icon: <AppMaterialIcons size={14} icon="delete" />,
        label: 'Delete term',
        onClick: onDeleteTermsPreflight
      }
    ],
    [setEditingTermName, onDeleteTermsPreflight]
  );

  const menu = useMemo(() => {
    return {
      items: dropdownItems
    };
  }, [dropdownItems]);

  return (
    <Dropdown trigger={['click']} menu={menu}>
      <div
        className="h-fit! cursor-pointer"
        style={{
          height: 18,
          color: token.colorIcon
        }}>
        <AppMaterialIcons size={18} icon="more_horiz" />
      </div>
    </Dropdown>
  );
};

const ItemContainer: React.FC<{
  title: string | React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className }) => {
  return (
    <Card className={className}>
      <CardHeader variant={'gray'}>{title}</CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};
