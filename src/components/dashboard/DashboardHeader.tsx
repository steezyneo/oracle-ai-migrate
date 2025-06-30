
import React from 'react';
import { Button } from '@/components/ui/button';
import { Database, History, HelpCircle } from 'lucide-react';
import UserDropdown from '@/components/UserDropdown';
import HomeButton from '@/components/HomeButton';

interface DashboardHeaderProps {
  onGoToHistory: () => void;
  onGoHome: () => void;
  onShowHelp: () => void;
  title?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onGoToHistory,
  onGoHome,
  onShowHelp,
  title = "Migration Dashboard"
}) => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <HomeButton onClick={onGoHome} />
            <div className="flex items-center">
              <Database className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={onGoToHistory}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              History
            </Button>
            <Button 
              variant="outline" 
              onClick={onShowHelp}
              className="flex items-center gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              Help
            </Button>
            <UserDropdown />
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
