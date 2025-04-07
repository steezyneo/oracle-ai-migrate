
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface AIModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

const AIModelSelector: React.FC<AIModelSelectorProps> = ({ selectedModel, onModelChange }) => {
  // Set Gemini AI as default if it's not already selected
  React.useEffect(() => {
    if (selectedModel !== "gemini") {
      onModelChange("gemini");
    }
  }, [selectedModel, onModelChange]);

  return (
    <div className="w-full">
      <h3 className="text-lg font-medium mb-4">AI Model</h3>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 border p-4 rounded-md bg-primary/10">
            <div className="flex-grow">
              <div className="font-medium">Gemini AI</div>
              <div className="text-sm text-muted-foreground">Enhanced syntax accuracy for Sybase to Oracle conversion</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIModelSelector;
