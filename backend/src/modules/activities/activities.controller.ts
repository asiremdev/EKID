import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto, UpdateActivityDto } from './dto/activity.dto';
import { QueryActivityDto } from './dto/query-activity.dto';

@ApiTags('activities')
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List activities (filter by type, ageGroup, subject)' })
  findAll(@Query() query: QueryActivityDto) {
    return this.activities.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get an activity by id' })
  findOne(@Param('id') id: string) {
    return this.activities.findOne(id);
  }

  // ─── Admin-only management ───────────────────────────────────────────────────
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @ApiOperation({ summary: '[admin] Create an activity' })
  create(@Body() dto: CreateActivityDto) {
    return this.activities.create(dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: '[admin] Update an activity' })
  update(@Param('id') id: string, @Body() dto: UpdateActivityDto) {
    return this.activities.update(id, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: '[admin] Delete an activity' })
  remove(@Param('id') id: string) {
    return this.activities.remove(id);
  }
}
