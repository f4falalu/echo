export type FileType = 'metric' | 'dashboard'; //'dataset' | 'collection' | | 'term' | 'value'

export type ThoughtFileType =
  | 'metric'
  | 'dashboard'
  | 'collection'
  | 'dataset'
  | 'term'
  | 'value'
  | 'empty';

export type AllFileTypes = ThoughtFileType | FileType;
