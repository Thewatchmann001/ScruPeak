/**
 * Utility for processing land documents using AI extraction services.
 */

export interface ExtractionResult {
  titleDeedNumber?: string;
  ownerName?: string;
  dimensions?: string;
  areaSquareMeters?: number;
  surveyorName?: string;
  dateIssued?: string;
  confidenceScore: number;
}

/**
 * Sends a document to the AI extraction pipeline to pull land metadata.
 */
export async function extractLandMetadata(file: File): Promise<ExtractionResult> {
  const formData = new FormData();
  formData.append("document", file);

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/land/ai-process`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "AI processing failed");
    }

    const data = await response.json();
    
    return {
      titleDeedNumber: data.deed_number,
      ownerName: data.owner_name,
      dimensions: data.dimensions,
      areaSquareMeters: data.area_sqm,
      confidenceScore: data.confidence || 0.0,
    };
  } catch (error) {
    console.error("AI Document Processing Error:", error);
    throw error;
  }
}