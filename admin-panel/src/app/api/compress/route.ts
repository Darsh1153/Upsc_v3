/**
 * PDF & Image Compression API
 * 
 * This microservice compresses PDFs and images to be under 800KB
 * for use with OCR.space free tier.
 * 
 * POST /api/compress
 * Body: { file: base64, mimeType: string, targetSizeKB?: number }
 * Returns: { success: boolean, compressedFile: base64, originalSize: number, compressedSize: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

// CORS headers for mobile app access
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle preflight
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Compress a PDF by:
 * 1. Removing metadata
 * 2. Optimizing embedded images (if possible)
 * 3. Removing unused objects
 */
async function compressPDF(base64Data: string, targetSizeKB: number): Promise<{ success: boolean; data: string; originalSize: number; compressedSize: number; error?: string }> {
    try {
        // Decode base64 to buffer
        const pdfBuffer = Buffer.from(base64Data, 'base64');
        const originalSize = pdfBuffer.length;

        console.log(`[Compress] Original PDF size: ${(originalSize / 1024).toFixed(1)}KB`);

        // Load the PDF
        const pdfDoc = await PDFDocument.load(pdfBuffer, {
            ignoreEncryption: true,
        });

        // Remove metadata to reduce size
        pdfDoc.setTitle('');
        pdfDoc.setAuthor('');
        pdfDoc.setSubject('');
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer('');
        pdfDoc.setCreator('');

        // Get page count
        const pageCount = pdfDoc.getPageCount();
        console.log(`[Compress] PDF has ${pageCount} pages`);

        // If PDF is very large and has many pages, we might need to extract only some pages
        const maxPages = Math.min(pageCount, 10); // Limit to 10 pages max for OCR

        // Create a new PDF with only the first N pages if needed
        let compressedPdfBytes: Uint8Array;

        if (pageCount > maxPages) {
            console.log(`[Compress] Extracting first ${maxPages} pages from ${pageCount} total`);
            const newPdf = await PDFDocument.create();
            const pages = await newPdf.copyPages(pdfDoc, Array.from({ length: maxPages }, (_, i) => i));
            pages.forEach(page => newPdf.addPage(page));
            compressedPdfBytes = await newPdf.save({
                useObjectStreams: true, // Compress objects
            });
        } else {
            // Save with compression
            compressedPdfBytes = await pdfDoc.save({
                useObjectStreams: true, // Compress objects
            });
        }

        const compressedSize = compressedPdfBytes.length;
        console.log(`[Compress] Compressed PDF size: ${(compressedSize / 1024).toFixed(1)}KB`);

        // Convert back to base64
        const compressedBase64 = Buffer.from(compressedPdfBytes).toString('base64');

        // Check if we're under target
        if (compressedSize > targetSizeKB * 1024) {
            // If still too large, try extracting fewer pages
            if (pageCount > 5) {
                console.log(`[Compress] Still too large, extracting first 5 pages`);
                const smallerPdf = await PDFDocument.create();
                const pages = await smallerPdf.copyPages(pdfDoc, [0, 1, 2, 3, 4].filter(i => i < pageCount));
                pages.forEach(page => smallerPdf.addPage(page));
                const smallerBytes = await smallerPdf.save({ useObjectStreams: true });

                if (smallerBytes.length <= targetSizeKB * 1024) {
                    return {
                        success: true,
                        data: Buffer.from(smallerBytes).toString('base64'),
                        originalSize,
                        compressedSize: smallerBytes.length,
                    };
                }
            }

            // If even 5 pages is too large, return error with suggestion
            return {
                success: false,
                data: compressedBase64,
                originalSize,
                compressedSize,
                error: `PDF still ${(compressedSize / 1024).toFixed(0)}KB after compression. Try taking screenshots of pages instead.`,
            };
        }

        return {
            success: true,
            data: compressedBase64,
            originalSize,
            compressedSize,
        };

    } catch (error: any) {
        console.error('[Compress] PDF compression error:', error);
        return {
            success: false,
            data: base64Data,
            originalSize: base64Data.length,
            compressedSize: base64Data.length,
            error: error.message || 'Failed to compress PDF',
        };
    }
}

/**
 * Compress an image by resizing and reducing quality
 */
async function compressImage(base64Data: string, mimeType: string, targetSizeKB: number): Promise<{ success: boolean; data: string; originalSize: number; compressedSize: number; error?: string }> {
    try {
        // Dynamically import sharp (it has native dependencies)
        const sharp = (await import('sharp')).default;

        // Decode base64 to buffer
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const originalSize = imageBuffer.length;

        console.log(`[Compress] Original image size: ${(originalSize / 1024).toFixed(1)}KB`);

        // Get image metadata
        const metadata = await sharp(imageBuffer).metadata();
        console.log(`[Compress] Image dimensions: ${metadata.width}x${metadata.height}`);

        // Calculate resize factor based on target size
        let quality = 80;
        let maxDimension = 2000;
        let compressedBuffer: Buffer;

        // Start with high quality and reduce if needed
        for (let attempt = 0; attempt < 5; attempt++) {
            let sharpInstance = sharp(imageBuffer);

            // Resize if dimensions are too large
            if (metadata.width && metadata.height) {
                if (metadata.width > maxDimension || metadata.height > maxDimension) {
                    sharpInstance = sharpInstance.resize(maxDimension, maxDimension, {
                        fit: 'inside',
                        withoutEnlargement: true,
                    });
                }
            }

            // Convert to JPEG for best compression
            compressedBuffer = await sharpInstance
                .jpeg({ quality, mozjpeg: true })
                .toBuffer();

            console.log(`[Compress] Attempt ${attempt + 1}: ${(compressedBuffer.length / 1024).toFixed(1)}KB (quality: ${quality}, maxDim: ${maxDimension})`);

            if (compressedBuffer.length <= targetSizeKB * 1024) {
                break;
            }

            // Reduce quality and/or dimensions
            quality = Math.max(30, quality - 15);
            maxDimension = Math.max(800, maxDimension - 300);
        }

        const compressedSize = compressedBuffer!.length;
        const compressedBase64 = compressedBuffer!.toString('base64');

        return {
            success: compressedSize <= targetSizeKB * 1024,
            data: compressedBase64,
            originalSize,
            compressedSize,
            error: compressedSize > targetSizeKB * 1024
                ? `Image reduced to ${(compressedSize / 1024).toFixed(0)}KB but still over target`
                : undefined,
        };

    } catch (error: any) {
        console.error('[Compress] Image compression error:', error);
        return {
            success: false,
            data: base64Data,
            originalSize: base64Data.length,
            compressedSize: base64Data.length,
            error: error.message || 'Failed to compress image',
        };
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { file, mimeType, targetSizeKB = 800 } = body;

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400, headers: corsHeaders }
            );
        }

        if (!mimeType) {
            return NextResponse.json(
                { success: false, error: 'No mimeType provided' },
                { status: 400, headers: corsHeaders }
            );
        }

        console.log(`[Compress] Processing ${mimeType}, target: ${targetSizeKB}KB`);

        let result;

        if (mimeType === 'application/pdf') {
            result = await compressPDF(file, targetSizeKB);
        } else if (mimeType.startsWith('image/')) {
            result = await compressImage(file, mimeType, targetSizeKB);
        } else {
            return NextResponse.json(
                { success: false, error: `Unsupported file type: ${mimeType}` },
                { status: 400, headers: corsHeaders }
            );
        }

        return NextResponse.json({
            success: result.success,
            compressedFile: result.data,
            mimeType: mimeType.startsWith('image/') ? 'image/jpeg' : mimeType,
            originalSizeKB: Math.round(result.originalSize / 1024),
            compressedSizeKB: Math.round(result.compressedSize / 1024),
            compressionRatio: ((1 - result.compressedSize / result.originalSize) * 100).toFixed(1) + '%',
            error: result.error,
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('[Compress] API error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Compression failed' },
            { status: 500, headers: corsHeaders }
        );
    }
}
