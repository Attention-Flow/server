import { UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { User as UserMdl } from './models/user.model';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UID } from '../auth/uid.decorator';
import { User } from './schemas/user.schema';
@Resolver(() => UserMdl)
export class UsersResolver {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Query(() => UserMdl)
  async currentUser(@UID() uid: string): Promise<UserMdl> {
    const user = await this.userService.getUser(uid);
    return await this.toMdlUser(user);
  }

  async toMdlUser(user: User): Promise<UserMdl> {
    const profile = await this.userService.getUserProfile(user.id);
    return {
      id: user.id,
      ...profile,
    };
  }
}
