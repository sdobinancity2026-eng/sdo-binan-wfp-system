export interface Department {
  id: string;
  code: string;
  name: string;
  total_budget: number;
}

export interface WFPItem {
  id: string;
  title: string;
  fiscal_year: number;
  focal_person_id: string;
  department_id: string;
  aip_code: string;
  sip_alignment_status: string;
  status: 'Draft' | 'For Review' | 'Approved' | 'Needs Revision';
  total_allocated: number;
  total_obligated: number;
  total_disbursed: number;
  physical_target_q1: number;
  physical_actual_q1: number;
  physical_target_q2: number;
  physical_actual_q2: number;
  remarks?: string;
  departments?: Department;
  profiles?: { full_name: string };
}