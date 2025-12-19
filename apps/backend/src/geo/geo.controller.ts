import { Controller, Get, Query } from '@nestjs/common';
import { GeoService } from './geo.service';

@Controller('geo')
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  @Get('ua/settlements')
  settlements(@Query('q') q = '', @Query('limit') limit = '20') {
    const n = Math.max(1, Math.min(50, Number(limit) || 20));
    return this.geo.searchUaSettlements(q, n);
  }
}
