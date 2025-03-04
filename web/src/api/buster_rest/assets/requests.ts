import { BASE_URL } from '@/api/buster_rest/config';
import { PublicAssetResponse } from './interface';
import { FileType } from '@/api/asset_interfaces';

export const getAssetCheck = async ({
  type,
  id,
  jwtToken
}: {
  type: FileType;
  id: string;
  jwtToken: string | undefined;
}): Promise<PublicAssetResponse> => {
  const data = fetch(`${BASE_URL}/assets/${type}/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwtToken}`
    }
  })
    .then((response) => {
      return response.json();
    })
    .catch((error) => {
      return {
        id: '',
        public: false,
        password_required: false,
        has_access: false
      };
    });

  return data;
};
