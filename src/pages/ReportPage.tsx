import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ReportViewer from '@/components/ReportViewer';
import { ConversionReport } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Database, History as HistoryIcon, HelpCircle, Home } from 'lucide-react';
import UserDropdown from '@/components/UserDropdown';
import Help from '@/components/Help';

const ReportPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ConversionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('migration_reports')
          .select('report')
          .eq('id', reportId)
          .single();
        if (error) throw error;
        setReport(data.report as ConversionReport);
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
      {/* Navigation Bar */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100">
              <Home className="h-5 w-5" />
              Home
            </button>
            <Database className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Migration Report</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/history', { state: { previousReportId: reportId } })} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100">
              <HistoryIcon className="h-5 w-5" />
              History
            </button>
            <button onClick={() => setShowHelp(true)} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100">
              <HelpCircle className="h-5 w-5" />
              Help
            </button>
            <UserDropdown />
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <ReportViewer 
          report={report} 
          onBack={() => navigate('/migration', { state: { activeTab: 'conversion', recentReport: report } })} 
        />
      </main>
      {showHelp && <Help onClose={() => setShowHelp(false)} />}
    </div>
  );
};

export default ReportPage; 