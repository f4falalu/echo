import { DatasourceForm } from '../DataSourcesAddController/forms';
import { HeaderContainer } from '../DataSourcesAddController/HeaderContainer';

export const DataSourceIndividualController = ({ datasourceId }: { datasourceId: string }) => {
  return (
    <div className="flex flex-col space-y-5">
      <HeaderContainer
        buttonText="Datasources"
        linkUrl={{
          to: '/app/settings/datasources',
        }}
      />
      <DatasourceForm datasourceId={datasourceId} />
    </div>
  );
};
