export interface UnreviewedFile {
  id: string;
  user_id: string;
  file_name: string;
  converted_code: string;
  original_code: string;
  ai_generated_code?: string; // Original AI output
  status: 'unreviewed' | 'reviewed';
  created_at: string;
  updated_at: string;
  data_type_mapping?: any;
  issues?: any;
  performance_metrics?: any;
}

export interface UnreviewedFileInsert {
  user_id: string;
  file_name: string;
  converted_code: string;
  original_code: string;
  ai_generated_code?: string; // Original AI output
  status?: 'unreviewed' | 'reviewed';
  data_type_mapping?: any;
  issues?: any;
  performance_metrics?: any;
}

export interface UnreviewedFileUpdate {
  id: string;
  converted_code?: string;
  original_code?: string;
  status?: 'unreviewed' | 'reviewed';
}