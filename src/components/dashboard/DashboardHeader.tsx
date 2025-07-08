import React from 'react';
import { Button } from '@/components/ui/button';
import { Database, History, HelpCircle, Sun, Moon, Monitor } from 'lucide-react';
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
  // Remove all theme/dark/system mode logic and UI

  const themeIcon = <Sun className="h-5 w-5" />;

  return (
    <header className="bg-background shadow-sm border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <HomeButton onClick={onGoHome} />
            <div className="flex items-center">
              <Database className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
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
            <Button
              variant="outline"
              onClick={() => {}} // No theme toggle
              className="flex items-center gap-2"
              title="Theme: Light"
            >
              {themeIcon}
              Light
            </Button>
            <UserDropdown />
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
