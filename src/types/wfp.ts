export interface Department {
  id: string;
  code: string;
  name: string;
}

export interface Profile {
  full_name: string;
}

export interface WFPItem {
  id: string;
  title: string;
  aip_code: string;
  department_id: string;
  total_allocated: number;
  total_obligated: number;
  total_disbursed: number;
  status: 'For Review' | 'Approved' | 'Needs Revision' | string;
  evidence_of_success?: string;
  kpi?: string;
  leading_indicator?: string;
  lagging_indicator?: string;
  target?: string;
  created_at?: string;
  updated_at?: string;
  departments?: Department;
  profiles?: Profile;
}
