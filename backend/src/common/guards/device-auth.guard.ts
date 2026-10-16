import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DeviceAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const auth = request.headers.authorization as string | undefined;
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing device token');
    }

    const token = auth.slice(7);
    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });
      if (payload.type !== 'device') {
        throw new UnauthorizedException('Invalid device token');
      }
      request.child = {
        id: payload.childId,
        deviceId: payload.deviceId,
        parentId: payload.parentId,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired device token');
    }
  }
}
