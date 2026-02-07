import {
  BadRequestException,
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import * as fs from 'node:fs';
import * as path from 'node:path';
import sharpImport, { type Sharp } from 'sharp';

import { SessionGuard } from '../auth/session.guard';

const MAX_FILES = 10;
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const OUT_SIZE = 600;

function getUploadDir() {
  return path.resolve(__dirname, '..', '..', 'public', 'media', 'listings');
}

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function randomName() {
  const stamp = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 10);
  return `listing-${stamp}-${rnd}.jpg`;
}

function isAllowedMime(mime: string) {
  return (
    mime === 'image/jpeg' ||
    mime === 'image/png' ||
    mime === 'image/webp' ||
    mime === 'image/jpg'
  );
}

type UploadedImage = {
  mimetype: string;
  buffer: Buffer;
  originalname?: string;
  size?: number;
};

const sharp = sharpImport as unknown as (input: Buffer) => Sharp;

@Controller('media')
export class MediaController {
  @UseGuards(SessionGuard)
  @Post('listings')
  @UseInterceptors(
    FilesInterceptor('files', MAX_FILES, {
      limits: {
        files: MAX_FILES,
        fileSize: MAX_FILE_SIZE,
      },
    }),
  )
  async uploadListingImages(@UploadedFiles() files: UploadedImage[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    if (files.length > MAX_FILES) {
      throw new BadRequestException(`Max files: ${MAX_FILES}`);
    }

    const dir = getUploadDir();
    ensureDir(dir);

    const savedUrls: string[] = [];

    for (const f of files) {
      if (!f || !Buffer.isBuffer(f.buffer)) {
        throw new BadRequestException(
          'File buffer missing (check interceptor)',
        );
      }

      const mime = String(f.mimetype || '');
      if (!isAllowedMime(mime)) {
        throw new BadRequestException('Only images are allowed');
      }

      const outName = randomName();
      const outPath = path.join(dir, outName);

      await sharp(f.buffer)
        .rotate()
        .resize(OUT_SIZE, OUT_SIZE, {
          fit: 'inside',
          withoutEnlargement: true,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(outPath);

      savedUrls.push(`/media/listings/${outName}`);
    }

    return { images: savedUrls };
  }
}
