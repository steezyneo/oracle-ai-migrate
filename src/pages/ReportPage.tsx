import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ReportViewer from '@/components/ReportViewer';
import { ConversionReport } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const ReportPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ConversionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch the report data from Supabase (adjust table/logic as needed)
        const { data, error } = await supabase
          .from('deployment_logs')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        setReport(data as ConversionReport);
      } catch (err: any) {
        setError('Failed to fetch report.');
      } finally {
        setLoading(false);
      }
    };
    if (reportId) fetchReport();
  }, [reportId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading report...</div>;
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  }
  if (!report) {
    return <div className="min-h-screen flex items-center justify-center">Report not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Migration Report</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <ReportViewer report={report} onBack={() => navigate(-1)} />
      </main>
    </div>
  );
};

export default ReportPage; 