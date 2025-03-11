import { TermPostParams, TermsListParams, TermUpdateParams } from '@/api/request_interfaces/terms';
import { mainApi } from '../instances';
import { BusterTerm, BusterTermListItem } from '@/api/asset_interfaces/terms';

export const getTermsList = async (params: TermsListParams) => {
  return mainApi.get<BusterTermListItem[]>('/terms', { params }).then((res) => res.data);
};

export const getTerm = async (id: string) => {
  return mainApi.get<BusterTerm>(`/terms/${id}`).then((res) => res.data);
};

export const createTerm = async (params: TermPostParams) => {
  return mainApi.post<BusterTerm>('/terms', params).then((res) => res.data);
};

export const updateTerm = async (params: TermUpdateParams) => {
  return mainApi.put<BusterTerm>(`/terms/${params.id}`, params).then((res) => res.data);
};

export const deleteTerms = async (ids: string[]) => {
  return mainApi.delete<BusterTerm>(`/terms`, { data: { ids } }).then((res) => res.data);
};
