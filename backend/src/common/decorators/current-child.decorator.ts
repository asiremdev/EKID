import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentChild = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const child = request.child ?? request.user;
    return data ? child?.[data] : child;
  },
);
