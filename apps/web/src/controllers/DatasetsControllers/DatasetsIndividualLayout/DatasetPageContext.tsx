import React, { type PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import { useDeployDataset, useIndividualDataset } from '@/api/buster_rest/datasets';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';

export const useDatasetPageContext = ({ datasetId }: { datasetId: string }) => {
  const { dataset, datasetData } = useIndividualDataset({ datasetId });

  const originalDatasetSQL = dataset?.data?.sql;
  const datasetYmlFile = dataset?.data?.yml_file;

  const [sql, setSQL] = useState<string>(originalDatasetSQL || '');
  const [ymlFile, setYmlFile] = useState<string>(datasetYmlFile || '');

  const datasetSQL = dataset?.data?.sql;

  const disablePublish = useMemo(() => {
    const originalSQL = datasetSQL || '';
    const originalYmlFile = datasetYmlFile || '';
    return !datasetId || !sql || !ymlFile || (originalYmlFile === ymlFile && originalSQL === sql);
  }, [datasetSQL, sql, datasetId, datasetYmlFile, ymlFile]);

  const isChangedSQL = useMemo(() => {
    return originalDatasetSQL !== sql;
  }, [originalDatasetSQL, sql]);

  const resetDataset = useMemoizedFn(() => {
    setSQL(originalDatasetSQL || '');
    setYmlFile(datasetYmlFile || '');
  });

  useEffect(() => {
    setSQL(originalDatasetSQL || '');
  }, [originalDatasetSQL]);

  useEffect(() => {
    setYmlFile(datasetYmlFile || '');
  }, [datasetYmlFile]);

  return {
    sql,
    ymlFile,
    resetDataset,

    setSQL,
    setYmlFile,
    datasetData,
    dataset,
    disablePublish,
    isChangedSQL,
    datasetId,
  };
};

const DatasetPageContext = createContext<ReturnType<typeof useDatasetPageContext>>(
  {} as ReturnType<typeof useDatasetPageContext>
);

export const DatasetPageProvider: React.FC<
  PropsWithChildren<{
    datasetId: string;
  }>
> = ({ children, datasetId }) => {
  const datasetPageContext = useDatasetPageContext({ datasetId });

  return (
    <DatasetPageContext.Provider value={datasetPageContext}>{children}</DatasetPageContext.Provider>
  );
};

const useDatasetPageContextSelector = <T,>(
  selector: (value: ReturnType<typeof useDatasetPageContext>) => T
) => useContextSelector(DatasetPageContext, selector);

const stableDatasetSelector = (state: ReturnType<typeof useDatasetPageContext>) => state.dataset;
export const useGetDatasetPageDataset = () => {
  return useDatasetPageContextSelector(stableDatasetSelector);
};

export const useGetDatasetPageDatasetId = () => {
  return useDatasetPageContextSelector((state) => state.datasetId);
};

const stableDatasetPublishStatusSelector = (state: ReturnType<typeof useDatasetPageContext>) =>
  state.disablePublish;
export const useGetDatasetPublishStatus = () => {
  const disablePublish = useDatasetPageContextSelector(stableDatasetPublishStatusSelector);
  return disablePublish;
};

const stableSQLSelector = (state: ReturnType<typeof useDatasetPageContext>) => state.sql;
const stableYmlFileSelector = (state: ReturnType<typeof useDatasetPageContext>) => state.ymlFile;
const stableSetSQLSelector = (state: ReturnType<typeof useDatasetPageContext>) => state.setSQL;
const stableSetYmlFileSelector = (state: ReturnType<typeof useDatasetPageContext>) =>
  state.setYmlFile;
export const useGetDatasetPageSQLAndYaml = () => {
  const sql = useDatasetPageContextSelector(stableSQLSelector);
  const ymlFile = useDatasetPageContextSelector(stableYmlFileSelector);
  const setSQL = useDatasetPageContextSelector(stableSetSQLSelector);
  const setYmlFile = useDatasetPageContextSelector(stableSetYmlFileSelector);
  return { sql, ymlFile, setSQL, setYmlFile };
};

export const usePublishDataset = () => {
  const { mutate: onUpdateDataset, isPending: isDeployingDataset } = useDeployDataset();
  const disablePublish = useGetDatasetPublishStatus();
  const datasetId = useGetDatasetPageDatasetId();
  const { sql, ymlFile } = useGetDatasetPageSQLAndYaml();

  const onPublishDataset = useMemoizedFn(async () => {
    if (disablePublish) return;
    onUpdateDataset({
      dataset_id: datasetId,
      sql: sql,
      yml: ymlFile,
    });
  });

  return {
    onPublishDataset,
    isDeployingDataset,
  };
};

const stableResetDatasetSelector = (state: ReturnType<typeof useDatasetPageContext>) =>
  state.resetDataset;
export const useGetDatasetPageResetDataset = () => {
  const resetDataset = useDatasetPageContextSelector(stableResetDatasetSelector);
  return resetDataset;
};

const stableIsChangedSQLSelector = (state: ReturnType<typeof useDatasetPageContext>) =>
  state.isChangedSQL;
export const useGetDatasetPageIsChangedSQL = () => {
  const isChangedSQL = useDatasetPageContextSelector(stableIsChangedSQLSelector);
  return isChangedSQL;
};

const stableDatasetDataSelector = (state: ReturnType<typeof useDatasetPageContext>) =>
  state.datasetData;
export const useGetDatasetPageDatasetData = () => {
  const datasetData = useDatasetPageContextSelector(stableDatasetDataSelector);
  return datasetData;
};
