'use server';

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function uploadPaymentProof(formData: FormData) {
    const file = formData.get('file') as File;

    if (!file) {
        return { error: 'No file uploaded' };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const filename = `${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

    // Ensure directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'payment-proofs');
    await mkdir(uploadDir, { recursive: true });

    const filepath = join(uploadDir, filename);

    try {
        await writeFile(filepath, buffer);
        return { url: `/uploads/payment-proofs/${filename}` };
    } catch (error) {
        console.error('Upload failed:', error);
        return { error: 'Upload failed' };
    }
}
