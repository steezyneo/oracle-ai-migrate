import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle, Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { rewritePromptsService } from '@/services/rewritePromptsService';
import { RewritePrompt } from '@/types';

interface RewritePromptsNotificationProps {
  isAdmin: boolean;
}

const RewritePromptsNotification: React.FC<RewritePromptsNotificationProps> = ({ isAdmin }) => {
  const [prompts, setPrompts] = useState<RewritePrompt[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const fetchPrompts = async () => {
    if (!isAdmin) return;
    
    setIsLoading(true);
    try {
      const fetchedPrompts = await rewritePromptsService.getAllPrompts();
      setPrompts(fetchedPrompts);
    } catch (error) {
      console.error('Error fetching prompts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load rewrite prompts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearPrompts = async () => {
    setIsLoading(true);
    try {
      const success = await rewritePromptsService.clearAllPrompts();
      if (success) {
        setPrompts([]);
        toast({
          title: 'Success',
          description: 'All rewrite prompts have been cleared',
          variant: 'default',
        });
      } else {
        throw new Error('Failed to clear prompts');
      }
    } catch (error) {
      console.error('Error clearing prompts:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear rewrite prompts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchPrompts();
    }
  }, [isAdmin]);

  if (!isAdmin || prompts.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Rewrite Prompts</CardTitle>
            <CardDescription>
              User-submitted rewrite prompts for AI training
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-500 mr-1" />
            {prompts.length} Prompts
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] rounded-md border p-4">
          <div className="space-y-4">
            {prompts.map((prompt) => (
              <div key={prompt.id} className="p-3 border rounded-md bg-slate-50">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="bg-blue-50">
                    File ID: {prompt.migrationFileId.substring(0, 8)}...
                  </Badge>
                  <Badge variant="outline" className="bg-slate-100">
                    {new Date(prompt.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
                <p className="text-sm font-medium mb-1">Prompt:</p>
                <p className="text-sm bg-white p-2 rounded border">{prompt.promptText}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleClearPrompts} 
          disabled={isLoading}
          className="w-full"
          variant="outline"
        >
          {isLoading ? (
            'Processing...'
          ) : (
            <>
              <Trash className="h-4 w-4 mr-2" />
              Clear All Prompts & Use for Training
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RewritePromptsNotification;