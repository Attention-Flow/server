import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const type = context.getType<'http' | 'ws' | 'rpc' | 'graphql'>();
    switch (type) {
      case 'graphql': {
        const ctx = GqlExecutionContext.create(context);
        return ctx.getContext().req;
      }
      case 'http': {
        const request = context.switchToHttp().getRequest();
        return request;
      }
      default: {
        throw new Error(`not support context: ${type}`);
      }
    }
  }
}
