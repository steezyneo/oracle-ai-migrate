
import React from 'react';

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

  // Return null since we don't want to render anything
  return null;
};

export default AIModelSelector;
