import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface ClientInfo {
  ipAddress: string;
  userAgent: string;
}

/** Extracts requesting client's IP + user agent (for sessions & audit logs). */
export const Client = createParamDecorator((_data: unknown, ctx: ExecutionContext): ClientInfo => {
  const request = ctx.switchToHttp().getRequest();
  const ipAddress =
    (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    request.socket?.remoteAddress ||
    request.ip ||
    'unknown';
  const userAgent = (request.headers['user-agent'] as string) ?? 'unknown';
  return { ipAddress, userAgent };
});
