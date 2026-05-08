import * as pdfjsLib from 'pdfjs-dist';

// Set worker source to the same version from esm.sh
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs';

export const extractTextFromPdf = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    const numPages = pdf.numPages;

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Filter out empty items and join strings
      // We join with space to approximate reading order
      const pageText = textContent.items
        .map((item: any) => item.str)
        .filter((str: string) => str.trim().length > 0)
        .join(' ');

      if (pageText.length > 0) {
        fullText += pageText + '\n\n';
      }
    }

    return fullText.trim();
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to extract text from PDF. Please ensure it is a valid text-based PDF.");
  }
};