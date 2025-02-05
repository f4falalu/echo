import {
  BusterMetricListItem,
  DEFAULT_CHART_CONFIG,
  ShareRole,
  VerificationStatus
} from '@/api/asset_interfaces';
import { IBusterMetric } from './interfaces';

export const defaultIBusterMetric: Required<IBusterMetric> = {
  id: 'DEFAULT_ID',
  type: 'metric',
  title: '',
  version_number: 1,
  description: '',
  time_frame: '',
  fetchedAt: 0,
  code: null,
  feedback: null,
  dataset_id: '',
  dataset_name: null,
  error: null,
  data_metadata: null,
  status: VerificationStatus.notRequested,
  evaluation_score: 'Moderate',
  evaluation_summary: '',
  file_name: '',
  file: '',
  data_source_id: '',
  created_at: '',
  updated_at: '',
  sent_by_id: '',
  sent_by_name: '',
  permission: ShareRole.VIEWER,
  sent_by_avatar_url: null,
  draft_session_id: null,
  dashboards: [],
  collections: [],
  chart_config: DEFAULT_CHART_CONFIG,
  sharingKey: '',
  individual_permissions: null,
  team_permissions: null,
  organization_permissions: null,
  password_secret_id: null,
  public_expiry_date: null,
  public_enabled_by: null,
  publicly_accessible: false,
  public_password: null,
  fetched: false,
  fetching: false
};

export const defaultBusterMetricListItem: Required<BusterMetricListItem> = {
  id: 'DEFAULT_ID',
  last_edited: '',
  title: '',
  dataset_name: '',
  dataset_uuid: '',
  created_by_id: '',
  created_by_name: '',
  created_by_email: '',
  created_by_avatar: '',
  status: VerificationStatus.notRequested,
  is_shared: false
};
