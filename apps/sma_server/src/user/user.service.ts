import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { randomUUID } from 'crypto';

interface UpdateGoogleData {
  id: string;
  displayName: string;
  name: { familyName: string; givenName: string };
  emails: { value: string; verified: boolean }[];
  photos: { value: string }[];
  provider: string;
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async createUser(args: { id?: string; userGoogle?: UpdateGoogleData }) {
    const mdl = await this.userModel.create({
      id: args.id ?? randomUUID(),
      google: args.userGoogle,
    });
    return mdl;
  }

  async updateUserGoogle(args: { id: string; data: UpdateGoogleData }) {
    return await this.userModel.updateOne(
      {
        id: args.id,
      },
      {
        $set: {
          google: args.data,
        },
      },
    );
  }

  async getUser(id: string) {
    return await this.userModel.findOne({
      id,
    });
  }

  async getUserViaGoogleId(id: string) {
    return await this.userModel.findOne({
      'google.id': id,
    });
  }

  async getUserProfile(id: string): Promise<{
    username: string;
    avatarUrl: string;
  }> {
    const user = await this.getUser(id);
    if (user.google) {
      return {
        username: user.google.displayName,
        avatarUrl: user.google.photos[0]?.value || '',
      };
    }

    return {
      username: 'unkown',
      avatarUrl: '',
    };
  }
}
