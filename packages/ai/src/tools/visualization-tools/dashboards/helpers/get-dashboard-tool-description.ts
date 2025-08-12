import dashboardToolDescription from './dashboard-tool-description.txt';

/**
 * Template parameters for the dashboard tool prompt
 */
export interface DashboardToolTemplateParams {
  dataSourceSyntax: string;
  date: string;
}

/**
 * Export the template function for use in dashboard tool
 */
export const getDashboardToolDescription = (): string => {
  return dashboardToolDescription;
};
