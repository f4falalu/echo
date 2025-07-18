import { mainApiV2 } from '../../instances';
import {
  GetUserToOrganizationResponse,
  GetUserToOrganizationRequest
} from '@buster/server-shared/user';

export const getUserToOrganization = async (payload: GetUserToOrganizationRequest) => {
  return mainApiV2
    .get<GetUserToOrganizationResponse>('/users', { params: payload })
    .then((response) => response.data);
};
