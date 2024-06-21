import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const UID = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const type = context.getType<'http' | 'ws' | 'rpc' | 'graphql'>();
    switch (type) {
      case 'graphql': {
        const gqlCtx = GqlExecutionContext.create(context);
        const user = gqlCtx.getContext().req.user;
        return user.id;
      }
      case 'http': {
        const user = context.switchToHttp().getRequest().user;
        return user.id;
      }
      default: {
        throw new Error(`not support context: ${type}`);
      }
    }
  },
);
