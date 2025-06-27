
import React from 'react';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

interface HomeButtonProps {
  onClick: () => void;
}

const HomeButton: React.FC<HomeButtonProps> = ({ onClick }) => {
  return (
    <Button 
      variant="outline" 
      onClick={onClick}
      className="flex items-center gap-2"
    >
      <Home className="h-4 w-4" />
      Home
    </Button>
  );
};

export default HomeButton;
