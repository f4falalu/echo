import { BusterSocketRequestBase } from '../base_interfaces';
import { SQLRunRequestParams } from '../../request_interfaces/sql/interfaces';

export type SQLRunEmit = BusterSocketRequestBase<'/sql/run', SQLRunRequestParams>;

export type SQLEmits = SQLRunEmit;
