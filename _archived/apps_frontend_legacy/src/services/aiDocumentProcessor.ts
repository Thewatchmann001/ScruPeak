/**
 * AI Document Processing Service
 * Extracts property data from PDFs, images, and documents using AI vision
 * 
 * Supports:
 * - OpenAI Vision API
 * - AWS Textract
 * - Google Cloud Vision
 */

import axios from 'axios';

export interface ExtractedPropertyData {
  address?: string;
  location?: string;
  area_sqm?: number;
  price?: number;
  owner_name?: string;
  description?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  confidence: number;
  extracted_fields: Record<string, any>;
  raw_text?: string;
}

export class AIDocumentProcessor {
  private apiKey: string;
  private apiBaseUrl: string;
  private provider: 'openai' | 'aws' | 'google' | 'local';

  constructor(
    provider: 'openai' | 'aws' | 'google' | 'local' = 'openai',
    apiKey?: string,
    apiBaseUrl?: string
  ) {
    this.provider = provider;
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_AI_API_KEY || '';
    this.apiBaseUrl = apiBaseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  /**
   * Process document and extract property information
   */
  async processDocument(file: File): Promise<ExtractedPropertyData> {
    try {
      // For MVP, send to backend for processing
      return await this.processViaBackend(file);
    } catch (error) {
      console.error('Error processing document:', error);
      throw error;
    }
  }

  /**
   * Send document to backend for processing
   * Backend handles AI processing and returns extracted data
   */
  private async processViaBackend(file: File): Promise<ExtractedPropertyData> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('provider', this.provider);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${this.apiBaseUrl}/api/v1/documents/process`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          }
        }
      );

      return response.data.extracted_data || response.data;
    } catch (error: any) {
      console.error('Backend processing error:', error);
      throw new Error(error.response?.data?.detail || 'Failed to process document');
    }
  }

  /**
   * Process using OpenAI Vision API (client-side)
   */
  private async processViaOpenAI(file: File): Promise<ExtractedPropertyData> {
    // Convert file to base64
    const base64 = await this.fileToBase64(file);
    const mediaType = this.getMediaType(file.type);

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mediaType};base64,${base64}`,
                  },
                },
                {
                  type: 'text',
                  text: `Extract the following information from this land/property document:
                  - Address
                  - Location/GPS coordinates
                  - Total area (in square meters)
                  - Listed price
                  - Owner name
                  - Property description/features
                  
                  Return as JSON with keys: address, location, area_sqm, price, owner_name, description, coordinates
                  For coordinates, return as {latitude, longitude}
                  If a field is not found, use null.`,
                },
              ],
            },
          ],
          max_tokens: 1024,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          }
        }
      );

      const content = response.data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      return {
        ...extracted,
        confidence: 0.85,
        extracted_fields: extracted,
        raw_text: content,
      };
    } catch (error: any) {
      console.error('OpenAI Vision error:', error);
      throw error;
    }
  }

  /**
   * Process using AWS Textract API (client-side)
   */
  private async processViaAwsTextract(file: File): Promise<ExtractedPropertyData> {
    // This would use AWS SDK - for MVP, use backend instead
    return this.processViaBackend(file);
  }

  /**
   * Process using Google Cloud Vision API (client-side)
   */
  private async processViaGoogleVision(file: File): Promise<ExtractedPropertyData> {
    const base64 = await this.fileToBase64(file);

    try {
      const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
        {
          requests: [
            {
              image: {
                content: base64,
              },
              features: [
                { type: 'TEXT_DETECTION' },
                { type: 'DOCUMENT_TEXT_DETECTION' },
              ],
            },
          ],
        }
      );

      const textAnnotations = response.data.responses[0].textAnnotations || [];
      const rawText = textAnnotations.map((t: any) => t.description).join('\n');

      // Parse extracted text for property information
      const extracted = this.parsePropertyText(rawText);

      return {
        ...extracted,
        confidence: 0.75,
        extracted_fields: extracted,
        raw_text: rawText,
      };
    } catch (error: any) {
      console.error('Google Vision error:', error);
      throw error;
    }
  }

  /**
   * Parse extracted text to find property information
   */
  private parsePropertyText(text: string): ExtractedPropertyData {
    const data: any = {};

    // Extract address
    const addressMatch = text.match(/(?:address|location|plot)[:\s]+([^\n]+)/i);
    if (addressMatch) data.address = addressMatch[1].trim();

    // Extract area
    const areaMatch = text.match(/(?:area|size|sqm|m²)[:\s]+(\d+(?:[.,]\d+)*)/i);
    if (areaMatch) data.area_sqm = parseFloat(areaMatch[1].replace(/,/g, ''));

    // Extract price
    const priceMatch = text.match(/(?:price|cost|amount)[:\s]+([₦$£€]?[\d,]+)/i);
    if (priceMatch) {
      const priceStr = priceMatch[1].replace(/[^\d]/g, '');
      data.price = parseFloat(priceStr);
    }

    // Extract owner name
    const ownerMatch = text.match(/(?:owner|seller|proprietor)[:\s]+([^\n]+)/i);
    if (ownerMatch) data.owner_name = ownerMatch[1].trim();

    // Extract coordinates
    const coordMatch = text.match(/(?:latitude|lat)[:\s]*(-?\d+[.,]\d+)[,\s]+(?:longitude|long)[:\s]*(-?\d+[.,]\d+)/i);
    if (coordMatch) {
      data.coordinates = {
        latitude: parseFloat(coordMatch[1].replace(',', '.')),
        longitude: parseFloat(coordMatch[2].replace(',', '.')),
      };
    }

    return data;
  }

  /**
   * Convert file to base64 string
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Get MIME type for file
   */
  private getMediaType(fileType: string): string {
    const mimeTypes: Record<string, string> = {
      'application/pdf': 'application/pdf',
      'image/jpeg': 'image/jpeg',
      'image/png': 'image/png',
      'image/jpg': 'image/jpeg',
      'application/msword': 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    return mimeTypes[fileType] || fileType;
  }

  /**
   * Validate extracted data quality
   */
  validateExtractedData(data: ExtractedPropertyData): {
    isValid: boolean;
    errors: string[];
    confidence: number;
  } {
    const errors: string[] = [];
    let confidence = data.confidence || 0.5;

    // Check required fields
    if (!data.address) {
      errors.push('Address is missing');
      confidence -= 0.1;
    }

    if (!data.area_sqm || data.area_sqm <= 0) {
      errors.push('Valid area is missing');
      confidence -= 0.15;
    }

    if (!data.price || data.price <= 0) {
      errors.push('Valid price is missing');
      confidence -= 0.15;
    }

    if (!data.owner_name) {
      errors.push('Owner name is missing');
      confidence -= 0.1;
    }

    // Check data reasonableness
    if (data.area_sqm && (data.area_sqm < 1 || data.area_sqm > 1000000)) {
      errors.push('Area value seems unrealistic');
      confidence -= 0.05;
    }

    if (data.price && (data.price < 100000 || data.price > 1000000000)) {
      errors.push('Price value seems unrealistic');
      confidence -= 0.05;
    }

    // Ensure confidence is between 0 and 1
    confidence = Math.max(0, Math.min(1, confidence));

    return {
      isValid: errors.length === 0 && confidence > 0.6,
      errors,
      confidence,
    };
  }

  /**
   * Batch process multiple documents
   */
  async batchProcessDocuments(files: File[]): Promise<ExtractedPropertyData[]> {
    const results: ExtractedPropertyData[] = [];

    for (const file of files) {
      try {
        const result = await this.processDocument(file);
        results.push(result);
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        // Continue processing other files
      }
    }

    return results;
  }
}

// Export singleton instance
export const documentProcessor = new AIDocumentProcessor();
