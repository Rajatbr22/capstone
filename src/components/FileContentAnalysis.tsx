
import React from 'react';
import { NLPAnalysisResult } from '@/types';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Check, 
  Tag, 
  BookOpen,
  Globe,
  Key
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { evaluateSecurityRisk } from '@/lib/nlp-service';

interface FileContentAnalysisProps {
  nlpResults: NLPAnalysisResult;
  isScanning: boolean;
  onClose: () => void;
  onAction: (action: 'apply' | 'quarantine') => void;
}

const FileContentAnalysis: React.FC<FileContentAnalysisProps> = ({
  nlpResults,
  isScanning,
  onClose,
  onAction
}) => {
  if (isScanning) {
    return (
      <div className="py-8 text-center">
        <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4 animate-pulse dark:bg-blue-900">
          <ShieldAlert className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="font-medium text-lg">Scanning content...</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Using natural language processing to analyze file content and detect security risks
        </p>
        <Progress className="mt-4 max-w-md mx-auto" value={Math.random() * 100} />
      </div>
    );
  }

  if (!nlpResults) {
    return null;
  }

  return (
    <div className="py-4 space-y-6">
      <div className="bg-muted p-3 rounded-lg flex items-center gap-3 border">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          nlpResults.maliciousContent ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' :
          nlpResults.sensitiveContent ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400' :
          'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
        }`}>
          {nlpResults.maliciousContent ? (
            <AlertTriangle className="w-5 h-5" />
          ) : nlpResults.sensitiveContent ? (
            <ShieldAlert className="w-5 h-5" />
          ) : (
            <Check className="w-5 h-5" />
          )}
        </div>
        <div>
          <div className="font-medium">
            {nlpResults.maliciousContent ? 'Potentially Malicious Content Detected' :
             nlpResults.sensitiveContent ? 'Sensitive Information Detected' :
             'Content Analysis Complete - No Issues Detected'}
          </div>
          <div className="text-sm text-muted-foreground">
            AI confidence level: {(nlpResults.confidenceScore * 100).toFixed(1)}%
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border bg-card">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-primary" />
            <span>Security Assessment</span>
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Sensitive Content</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  nlpResults.sensitiveContent 
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' 
                    : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                }`}>
                  {nlpResults.sensitiveContent ? 'Detected' : 'None detected'}
                </span>
              </div>
              <Progress 
                value={nlpResults.sensitiveContent ? 80 : 10} 
                className={`h-2 ${nlpResults.sensitiveContent ? 'bg-yellow-100' : 'bg-green-100'}`}
              />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Malicious Content</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  nlpResults.maliciousContent 
                    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' 
                    : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                }`}>
                  {nlpResults.maliciousContent ? 'Detected' : 'None detected'}
                </span>
              </div>
              <Progress 
                value={nlpResults.maliciousContent ? 90 : 5} 
                className={`h-2 ${nlpResults.maliciousContent ? 'bg-red-100' : 'bg-green-100'}`}
              />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Risk Level</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  nlpResults.maliciousContent ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                  nlpResults.sensitiveContent ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                  'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                }`}>
                  {nlpResults.maliciousContent ? 'High' :
                   nlpResults.sensitiveContent ? 'Medium' :
                   'Low'}
                </span>
              </div>
              <Progress 
                value={
                  nlpResults.maliciousContent ? 90 :
                  nlpResults.sensitiveContent ? 50 :
                  10
                } 
                className={`h-2 ${
                  nlpResults.maliciousContent ? 'bg-red-100' :
                  nlpResults.sensitiveContent ? 'bg-yellow-100' :
                  'bg-green-100'
                }`}
              />
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-lg border bg-card">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            <span>Content Classification</span>
          </h3>
          
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium mb-2 block">Categories</span>
              <div className="flex flex-wrap gap-2">
                {nlpResults.contentCategory && nlpResults.contentCategory.map((category) => (
                  <Badge key={category} className="bg-primary/20 text-primary hover:bg-primary/30 border-none">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <span className="text-sm font-medium mb-2 block">Detected Entities</span>
              <div className="flex flex-wrap gap-2">
                {nlpResults.detectedEntities && nlpResults.detectedEntities.length > 0 ? 
                  nlpResults.detectedEntities.map((entity) => (
                    <Badge key={entity} variant="outline" className="bg-muted">
                      {entity}
                    </Badge>
                  )) : (
                    <span className="text-sm text-muted-foreground">No entities detected</span>
                  )
                }
              </div>
            </div>
            
            <div>
              <span className="text-sm font-medium mb-2 block">Analysis Confidence</span>
              <div className="w-full bg-muted/50 rounded-full h-2.5">
                <div 
                  className="h-2.5 rounded-full bg-blue-600"
                  style={{ width: `${nlpResults.confidenceScore * 100}%` }}
                />
              </div>
              <div className="text-right text-xs mt-1">
                {(nlpResults.confidenceScore * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border bg-card">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            <span>Content Metadata</span>
          </h3>
          
          <div className="space-y-3">
            {nlpResults.language && (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Language</span>
                </div>
                <Badge>{nlpResults.language}</Badge>
              </div>
            )}
            
            {nlpResults.readingLevel && (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Reading Level</span>
                </div>
                <Badge variant="outline" className="capitalize">{nlpResults.readingLevel}</Badge>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 rounded-lg border bg-card">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" />
            <span>Key Phrases</span>
          </h3>
          
          <div className="space-y-3">
            {nlpResults.keywords && nlpResults.keywords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {nlpResults.keywords.map(keyword => (
                  <Badge key={keyword} variant="secondary" className="capitalize">
                    {keyword}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">No key phrases detected</span>
            )}
          </div>
        </div>
      </div>
      
      {(nlpResults.sensitiveContent || nlpResults.maliciousContent) && (
        <div className={`p-4 rounded-lg border ${
          nlpResults.maliciousContent 
            ? 'border-red-200 bg-red-50 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-300' 
            : 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-300'
        }`}>
          <h3 className="font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Security Recommendations</span>
          </h3>
          <div className="mt-2 space-y-2 text-sm">
            {nlpResults.maliciousContent && (
              <p className="flex items-start gap-2">
                <span className="min-w-4">•</span>
                <span>This file contains potentially malicious content. We recommend isolating this file and conducting a thorough security review before sharing or using it.</span>
              </p>
            )}
            {nlpResults.sensitiveContent && (
              <p className="flex items-start gap-2">
                <span className="min-w-4">•</span>
                <span>This file contains sensitive information. Restrict access to authorized personnel only and consider applying additional encryption.</span>
              </p>
            )}
            <p className="flex items-start gap-2">
              <span className="min-w-4">•</span>
              <span>Review the file's access permissions to ensure only necessary users have access.</span>
            </p>
          </div>
        </div>
      )}
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button
          variant={nlpResults.maliciousContent ? "destructive" : "default"}
          onClick={() => onAction(nlpResults.maliciousContent ? 'quarantine' : 'apply')}
        >
          {nlpResults.maliciousContent ? 'Quarantine File' : 'Apply Recommendations'}
        </Button>
      </div>
    </div>
  );
};

export default FileContentAnalysis;
