import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

// Free OCR.space API key (get your own at https://ocr.space/ocrapi)
const OCR_API_KEY = 'K85553321788957';
const OCR_API_URL = 'https://api.ocr.space/parse/image';

/**
 * Pick a PDF or text file from device
 */
export const pickPDF = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'text/plain', 'text/*', 'image/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return { success: false, canceled: true };
    }

    const file = result.assets[0];
    const fileName = file.name || 'document';
    const isPDF = file.mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
    const isImage = file.mimeType?.startsWith('image/');

    return {
      success: true,
      file: {
        uri: file.uri,
        name: fileName,
        size: file.size,
        mimeType: file.mimeType || 'application/pdf',
        isPDF,
        isImage,
      },
    };
  } catch (error) {
    console.error('Error picking file:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Scan PDF/Image using OCR.space API with URL method
 */
const scanWithOCR = async (fileUri, fileName, mimeType, onProgress) => {
  try {
    onProgress?.('Reading file...');

    // Read file as base64
    let base64Data;
    try {
      base64Data = await FileSystem.readAsStringAsync(fileUri, {
        encoding: 'base64',
      });
    } catch (readError) {
      console.error('Error reading file:', readError);
      return { success: false, error: 'Could not read the file. Please try again.' };
    }

    if (!base64Data || base64Data.length === 0) {
      return { success: false, error: 'File appears to be empty' };
    }

    onProgress?.('Uploading to OCR service...');

    // Determine file type
    const isPDF = fileName?.toLowerCase().endsWith('.pdf') || mimeType === 'application/pdf';
    const dataPrefix = isPDF
      ? 'data:application/pdf;base64,'
      : `data:${mimeType || 'image/png'};base64,`;

    onProgress?.('Scanning document...');

    // Create form data
    const formData = new FormData();
    formData.append('base64Image', dataPrefix + base64Data);
    formData.append('apikey', OCR_API_KEY);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('filetype', isPDF ? 'PDF' : 'Auto');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2');

    // Call OCR API
    const response = await fetch(OCR_API_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, error: `Server error: ${response.status}` };
    }

    const result = await response.json();

    if (result.OCRExitCode === 1 && result.ParsedResults && result.ParsedResults.length > 0) {
      const fullText = result.ParsedResults
        .map(page => page.ParsedText || '')
        .join('\n\n');

      if (fullText.trim().length === 0) {
        return { success: false, error: 'No text found in document' };
      }

      return { success: true, text: fullText };
    } else {
      const errorMsg = result.ErrorMessage ||
        result.ParsedResults?.[0]?.ErrorMessage ||
        'OCR could not process the file';
      return { success: false, error: errorMsg };
    }
  } catch (error) {
    console.error('OCR Error:', error);
    return { success: false, error: 'Network error. Check your connection.' };
  }
};

/**
 * Parse MCQ text content into structured questions
 */
export const parseMCQText = (text) => {
  const questions = [];

  const cleanText = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/_+/g, '')
    .replace(/-{3,}/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const questionBlocks = cleanText.split(/(?=(?:^|\n)\s*Q?\d+[.):\s])/gi).filter(s => s.trim());

  let questionNum = 1;

  for (const block of questionBlocks) {
    const question = parseQuestionBlock(block, questionNum);
    if (question) {
      questions.push(question);
      questionNum++;
    }
  }

  return questions;
};

/**
 * Parse a single question block
 */
const parseQuestionBlock = (block, defaultNum) => {
  const lines = block.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 3) return null;

  let questionText = lines[0].replace(/^Q?\d+[.):\s]+/i, '').trim();
  if (!questionText) return null;

  const options = [];
  let correctIndex = -1;
  let answerFound = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    const optionMatch = line.match(/^Option\s*([A-Da-d])[:\s]+(.+)/i);
    if (optionMatch) {
      options.push(optionMatch[2].trim());
      continue;
    }

    const simpleMatch = line.match(/^([A-Da-d])[.):\s]+(.+)/i);
    if (simpleMatch && !answerFound) {
      const optionText = simpleMatch[2].trim();
      if (!optionText.toLowerCase().startsWith('answer') &&
        !optionText.toLowerCase().startsWith('correct')) {
        options.push(optionText);
        continue;
      }
    }

    const answerMatch = line.match(/^(?:answer|correct|ans)(?:\s+is)?[:\s]+([A-Da-d])/i);
    if (answerMatch) {
      correctIndex = answerMatch[1].toUpperCase().charCodeAt(0) - 65;
      answerFound = true;
      continue;
    }

    const standaloneAnswer = line.match(/^([A-Da-d])$/i);
    if (standaloneAnswer && options.length >= 2) {
      correctIndex = standaloneAnswer[1].toUpperCase().charCodeAt(0) - 65;
      answerFound = true;
    }
  }

  if (options.length < 2) return null;

  while (options.length < 4) {
    options.push(`Option ${String.fromCharCode(65 + options.length)}`);
  }

  if (correctIndex < 0 || correctIndex >= options.length) {
    correctIndex = 0;
  }

  return {
    id: defaultNum,
    question: questionText,
    options: options.slice(0, 4),
    correct: correctIndex,
    explanation: `The correct answer is ${String.fromCharCode(65 + correctIndex)}: ${options[correctIndex]}`,
    systemTags: ['Uploaded PDF'],
  };
};

/**
 * Try to read text content from text files
 */
const tryReadTextFile = async (uri) => {
  try {
    const content = await FileSystem.readAsStringAsync(uri, {
      encoding: 'utf8',
    });
    return content;
  } catch (error) {
    return null;
  }
};

/**
 * Process uploaded PDF/Image file with OCR
 */
export const processPDF = async (fileInfo, onProgress) => {
  try {
    // For text files, read directly
    if (fileInfo.mimeType?.includes('text')) {
      onProgress?.('Reading text file...');
      const textContent = await tryReadTextFile(fileInfo.uri);

      if (textContent) {
        onProgress?.('Parsing questions...');
        const questions = parseMCQText(textContent);

        if (questions.length > 0) {
          return {
            success: true,
            questions,
            fileName: fileInfo.name,
            pagesScanned: 1,
          };
        }
      }
      return { success: false, error: 'No questions found in text file', needsManualInput: true };
    }

    // For PDFs and images, use OCR
    onProgress?.('Starting OCR scan...');

    const ocrResult = await scanWithOCR(
      fileInfo.uri,
      fileInfo.name,
      fileInfo.mimeType,
      onProgress
    );

    if (!ocrResult.success) {
      return {
        success: false,
        error: ocrResult.error,
        needsManualInput: true,
      };
    }

    onProgress?.('Extracting questions...');

    const questions = parseMCQText(ocrResult.text);

    if (questions.length > 0) {
      return {
        success: true,
        questions,
        fileName: fileInfo.name,
        pagesScanned: 1,
        scannedText: ocrResult.text,
      };
    } else {
      return {
        success: false,
        error: 'Scanned successfully but could not find MCQ format',
        scannedText: ocrResult.text,
        needsManualInput: true,
      };
    }

  } catch (error) {
    console.error('Error processing file:', error);
    return {
      success: false,
      error: error.message || 'Processing failed',
      needsManualInput: true,
    };
  }
};

/**
 * Process manually pasted text
 */
export const processManualText = (text) => {
  if (!text || text.trim().length === 0) {
    return { success: false, error: 'Please paste some text' };
  }

  const questions = parseMCQText(text);

  if (questions.length === 0) {
    return {
      success: false,
      error: 'Could not find any questions. Check the format.'
    };
  }

  return {
    success: true,
    questions,
    fileName: 'Pasted Text',
    pagesScanned: 1,
  };
};
