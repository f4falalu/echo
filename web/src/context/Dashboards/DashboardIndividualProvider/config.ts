import { BusterDashboard, VerificationStatus } from '@/api/asset_interfaces';

export const defaultBusterDashboard: BusterDashboard = {
  id: '',
  config: {
    rows: []
  },
  created_at: '',
  deleted_at: '',
  description: '',
  name: '',
  updated_at: '',
  created_by: '',
  updated_by: '',
  public_expiry_date: null,
  publicly_accessible: false,
  password_secret_id: null,
  sharingKey: '',
  public_enabled_by: '',
  status: VerificationStatus.notRequested,
  public_password: null,
  version_number: 1,
  file: '',
  file_name: ''
};
