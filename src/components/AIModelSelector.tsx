
import React from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface AIModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

const AIModelSelector: React.FC<AIModelSelectorProps> = ({ selectedModel, onModelChange }) => {
  return (
    <div className="w-full">
      <h3 className="text-lg font-medium mb-4">Select AI Model</h3>
      <Card>
        <CardContent className="pt-6">
          <RadioGroup 
            value={selectedModel} 
            onValueChange={onModelChange}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2 border p-4 rounded-md hover:bg-accent cursor-pointer">
              <RadioGroupItem value="default" id="default" />
              <Label htmlFor="default" className="cursor-pointer flex-grow">
                <div className="font-medium">Default AI</div>
                <div className="text-sm text-muted-foreground">Standard conversion model</div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 border p-4 rounded-md hover:bg-accent cursor-pointer">
              <RadioGroupItem value="gemini" id="gemini" />
              <Label htmlFor="gemini" className="cursor-pointer flex-grow">
                <div className="font-medium">Gemini AI</div>
                <div className="text-sm text-muted-foreground">Enhanced syntax accuracy</div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIModelSelector;
