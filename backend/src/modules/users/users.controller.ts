import { Body, Controller, Delete, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('parents')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('parents')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get parent profile' })
  me(@CurrentUser('id') userId: string) {
    return this.users.getProfile(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update parent profile' })
  update(@CurrentUser('id') userId: string, @Body() dto: UpdateUserDto) {
    return this.users.update(userId, dto);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Deactivate parent account (soft delete)' })
  deactivate(@CurrentUser('id') userId: string) {
    return this.users.deactivate(userId);
  }
}
