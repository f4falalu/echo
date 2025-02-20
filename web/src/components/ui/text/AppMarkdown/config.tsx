import { Components } from 'react-markdown';
import React from 'react';
import { BusterTimestampProps } from './AppMarkdown_BusterTimestamp';
import { BusterDatasetsProps } from './AppMarkdown_BusterDatasets';

export enum AppMarkdownComponentType {
  BusterTimestamp = 'buster-timestamp',
  BusterDatasets = 'buster-datasets'
}

//CUSTOM COMPONENTS
export interface CustomComponents extends Components {
  [AppMarkdownComponentType.BusterTimestamp]: React.FC<BusterTimestampProps>;
  [AppMarkdownComponentType.BusterDatasets]: React.FC<BusterDatasetsProps>;
}
