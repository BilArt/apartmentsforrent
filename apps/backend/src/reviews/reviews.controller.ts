import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { SessionGuard } from '../auth/session.guard';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get('reviews/health')
  health() {
    return { ok: true };
  }

  @UseGuards(SessionGuard)
  @Post('contracts/:contractId/reviews')
  async createForContract(
    @Param('contractId') contractId: string,
    @Req() req: Request,
    @Body() dto: CreateReviewDto,
  ) {
    const authorId = String(req.session.userId);

    const res = await this.reviews.createForContract(contractId, authorId, dto);

    if (res === 'NOT_FOUND') throw new NotFoundException('Contract not found');
    if (res === 'FORBIDDEN') throw new ForbiddenException('Not your contract');
    if (res === 'CONTRACT_NOT_COMPLETED') {
      throw new BadRequestException(
        'Contract must be COMPLETED to leave review',
      );
    }
    if (res === 'ALREADY_REVIEWED') {
      throw new BadRequestException(
        'You already left a review for this contract',
      );
    }
    if (res === 'INVALID_TARGET') {
      throw new BadRequestException('Invalid review target');
    }

    return res;
  }

  @Get('users/:userId/reviews')
  getForUser(@Param('userId') userId: string) {
    return this.reviews.getForUser(userId);
  }

  @UseGuards(SessionGuard)
  @Get('reviews/my')
  getMy(@Req() req: Request) {
    const authorId = String(req.session.userId);
    return this.reviews.getAuthoredByUser(authorId);
  }
}
