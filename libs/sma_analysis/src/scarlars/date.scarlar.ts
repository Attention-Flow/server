import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';


@Scalar('DateTime', (type) => Date)
export class DateScalar implements CustomScalar<string, Date> {
  description = 'Date custom scalar type';

  parseValue(value: number | string): Date {
    if (typeof value === 'string') {
      return new Date(value);
    } else {
      if (value.toString().length === 10) {
        value *= 1000;
      }
      return new Date(value);
    }
  }

  serialize(value: Date | number | string): string {
    switch (typeof value) {
      case 'string':
      case 'number':
        return this.parseValue(value).toISOString();
      default:
        return value.toISOString();
    }
  }

  parseLiteral(ast: ValueNode): Date {
    if (ast.kind === Kind.INT) {
      return this.parseValue(ast.value);
    } else if (ast.kind === Kind.STRING) {
      return this.parseValue(ast.value);
    }
    return null;
  }
}
