import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChildrenService } from './children.service';
import { CreateChildDto, UpdateChildDto } from './dto/child.dto';

@ApiTags('children')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('children')
export class ChildrenController {
  constructor(private readonly children: ChildrenService) {}

  @Post()
  @ApiOperation({ summary: 'Create a child profile' })
  create(@CurrentUser('id') parentId: string, @Body() dto: CreateChildDto) {
    return this.children.create(parentId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List the current parent children' })
  list(@CurrentUser('id') parentId: string) {
    return this.children.list(parentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a child profile' })
  get(@CurrentUser('id') parentId: string, @Param('id') id: string) {
    return this.children.get(parentId, id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get aggregated stats for a child' })
  stats(@CurrentUser('id') parentId: string, @Param('id') id: string) {
    return this.children.stats(parentId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a child profile' })
  update(
    @CurrentUser('id') parentId: string,
    @Param('id') id: string,
    @Body() dto: UpdateChildDto,
  ) {
    return this.children.update(parentId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a child profile' })
  remove(@CurrentUser('id') parentId: string, @Param('id') id: string) {
    return this.children.remove(parentId, id);
  }
}
