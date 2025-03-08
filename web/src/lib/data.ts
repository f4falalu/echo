import { unparse } from 'papaparse';

export const convertJsonToCSV = (jsonArray: any[]) => {
  return unparse(jsonArray);
};
