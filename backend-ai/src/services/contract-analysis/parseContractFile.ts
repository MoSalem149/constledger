import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import axios from 'axios';

/** Downloads a file from a URL and extracts its text content */
export async function parseContractFile(fileUrl: string): Promise<string> {
  const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(response.data);

  // Detect file type by URL extension
  const ext = fileUrl.split('?')[0].split('.').pop()?.toLowerCase();

  if (ext === 'pdf') {
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (ext === 'docx') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error(`Unsupported file type: ${ext}`);
}
