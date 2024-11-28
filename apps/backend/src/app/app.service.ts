import { BadRequestException, Injectable } from '@nestjs/common';
import OSS from 'ali-oss';
const { GoogleGenerativeAI } = require('@google/generative-ai');
import * as dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const client = new OSS({
  region: 'me-central-1', // Specify the region in which the bucket is located. Example: 'oss-cn-hangzhou'.
  accessKeyId: process.env.OSS_ACCESS_KEY_ID, // Make sure that the OSS_ACCESS_KEY_ID environment variable is configured.
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET, // Make sure that the OSS_ACCESS_KEY_SECRET environment variable is configured.
  bucket: 'posts-thumbnails',
  secure: true, // Use HTTPS. Default is false.
  endpoint: 'oss-me-central-1.aliyuncs.com',
});

@Injectable()
export class AppService {
  getData(): { message: string } {
    return { message: 'Hello API' };
  }

  async generateText(prompt) {
    try {
      const result = await model.generateContent(prompt);
      return { text: result.response.text() };
    } catch (error) {
      console.error('Text generation failed:', error);
      throw error;
    }
  }

  async uploadFile(file) {
    try {
      if (!file) {
        console.error('No file uploaded');
        return new BadRequestException('No file uploaded');
      }

      const objectName = `${Date.now()}-${file.originalname}`; // Generate a unique name
      const uploadResult = await client.put(objectName, file.buffer, {
        mime: file.mimetype,
        headers: {
          'Content-Type': file.mimetype,
        },
      }); // Upload using file buffer
      return {
        message: 'File uploaded successfully',
        url: uploadResult.url,
      };
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }
}
