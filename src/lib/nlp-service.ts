
import { NLPAnalysisResult, File } from '@/types';
import { supabase } from '@/lib/supabase';

// Base URL for the Flask backend
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-deployed-nlp-api.com'
  : 'http://localhost:5000';

/**
 * Service for communicating with the NLP Flask backend
 */
export const nlpService = {
  /**
   * Analyze text content using the NLP backend
   */
  analyzeText: async (text: string): Promise<NLPAnalysisResult> => {
    try {
      // Check if text is empty
      if (!text || text.trim() === '') {
        throw new Error('No text provided for analysis');
      }
      
      // Call the Flask backend API
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        // Try to get error details from the response
        let errorDetails = 'Unknown error';
        try {
          const errorData = await response.json();
          errorDetails = errorData.error || errorDetails;
        } catch (e) {
          // If we can't parse the JSON, use the status text
          errorDetails = response.statusText;
        }
        
        throw new Error(`API request failed: ${errorDetails}`);
      }
      
      const data = await response.json();
      return data as NLPAnalysisResult;
    } catch (error) {
      console.error('Error analyzing text:', error);
      
      // Return a fallback analysis result
      return {
        contentCategory: ['unknown'],
        keywords: [],
        language: 'unknown',
        readingLevel: 'unknown',
        sensitiveContent: false,
        maliciousContent: false,
        detectedEntities: [],
        confidenceScore: 0,
        anomalyScore: 0
      };
    }
  },
  
  /**
   * Process a file and store the analysis results in Supabase
   */
  processFileAndStoreResults: async (file: File): Promise<NLPAnalysisResult> => {
    try {
      // Get file content for analysis
      let textContent: string | null = null;
      
      // If content is already available and is a string, use it
      if (file.content && typeof file.content === 'string') {
        textContent = file.content;
      } 
      // For binary content, we'd need to process differently depending on file type
      // Here we're just handling the mock case
      else {
        console.log('No text content available for file, using mock data');
        textContent = `Sample content for ${file.name}`;
      }
      
      // Analyze the content
      const analysisResults = await nlpService.analyzeText(textContent);
      
      // Store the results in Supabase if configured
      if (supabase) {
        // Update the files table with analysis results
        const { error } = await supabase
          .from('files')
          .update({ 
            content_analysis: analysisResults,
            threat_score: analysisResults.anomalyScore || 0
          })
          .eq('id', file.id);
          
        if (error) {
          console.error('Error storing NLP analysis in Supabase:', error);
        } else {
          console.log('Successfully stored analysis results in Supabase');
        }
      }
      
      return analysisResults;
    } catch (error) {
      console.error('Error processing file:', error);
      return {
        contentCategory: ['unknown'],
        keywords: [],
        language: 'unknown',
        readingLevel: 'unknown',
        sensitiveContent: false,
        maliciousContent: false,
        detectedEntities: [],
        confidenceScore: 0,
        anomalyScore: 0
      };
    }
  },
  
  /**
   * Retrieve file analysis results from Supabase
   */
  getFileAnalysisFromSupabase: async (fileId: string): Promise<NLPAnalysisResult | null> => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('content_analysis')
        .eq('id', fileId)
        .single();
        
      if (error || !data) {
        console.error('Error retrieving file analysis from Supabase:', error);
        return null;
      }
      
      return data.content_analysis as NLPAnalysisResult;
    } catch (error) {
      console.error('Error retrieving file analysis:', error);
      return null;
    }
  },
  
  /**
   * Check if the NLP service is available
   */
  checkHealth: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      return response.ok;
    } catch (error) {
      console.error('NLP service health check failed:', error);
      return false;
    }
  },
  
  evaluateSecurityRisk
};

// Security risk evaluation function
export function evaluateSecurityRisk(results: NLPAnalysisResult | null): 'low' | 'medium' | 'high' {
  if (!results) {
    return 'low';
  }
  
  let riskScore = 0;
  
  // Check for sensitive content
  if (results.sensitiveContent) {
    riskScore += 3;
  }
  
  // Check for malicious content
  if (results.maliciousContent) {
    riskScore += 5;
  }
  
  // Use anomaly score if available
  if (results.anomalyScore !== undefined) {
    riskScore += results.anomalyScore * 2;
  }
  
  // Determine risk level
  if (riskScore >= 5) {
    return 'high';
  } else if (riskScore >= 2) {
    return 'medium';
  } else {
    return 'low';
  }
}

export default nlpService;
