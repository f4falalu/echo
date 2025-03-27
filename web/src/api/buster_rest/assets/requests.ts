import { BASE_URL } from '@/api/buster_rest/config';
import { PublicAssetResponse } from './interface';
import { FileType } from '@/api/asset_interfaces/chat';
import { mainApi } from '@/api/buster_rest/instances';
import { serverFetch } from '@/api/createServerInstance';

export const getAssetCheck_server = async ({
  type,
  id
}: {
  type: FileType;
  id: string;
}): Promise<PublicAssetResponse> => {
  // const data = fetch(`${BASE_URL}/assets/${type}/${id}`, {
  //   method: 'GET',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     Authorization: `Bearer ${jwtToken}`
  //   }
  // })
  //   .then((response) => {
  //     return response.json();
  //   })
  //   .catch((error) => {
  //     return {
  //       id: '',
  //       public: false,
  //       password_required: false,
  //       has_access: false
  //     };
  //   });

  return await serverFetch<PublicAssetResponse>(`/assets/${type}/${id}`).catch((error) => {
    return {
      id: '',
      public: false,
      password_required: false,
      has_access: false
    };
  });
};

export const getAssetCheck = async ({
  type,
  id
}: {
  type: FileType;
  id: string;
}): Promise<PublicAssetResponse> => {
  return mainApi.get<PublicAssetResponse>(`/assets/${type}/${id}`).then((res) => res.data);
};
