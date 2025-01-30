import { BusterSocketRequestBase } from '../base_interfaces';

export type OrganizationPostRequest = BusterSocketRequestBase<
  '/organizations/post',
  {
    name: string;
  }
>;

export type OrganizationsEmits = OrganizationPostRequest;
