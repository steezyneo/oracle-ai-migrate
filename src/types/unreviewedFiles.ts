export interface UnreviewedFile {
  id: string;
  user_id: string;
  file_name: string;
  converted_code: string;
  original_code: string;
  status: 'unreviewed' | 'reviewed';
  created_at: string;
  updated_at: string;
}

export interface UnreviewedFileInsert {
  user_id: string;
  file_name: string;
  converted_code: string;
  original_code: string;
  status?: 'unreviewed' | 'reviewed';
}

export interface UnreviewedFileUpdate {
  id: string;
  converted_code?: string;
  original_code?: string;
  status?: 'unreviewed' | 'reviewed';
}