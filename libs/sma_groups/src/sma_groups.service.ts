import { Injectable } from '@nestjs/common';
import { Datasource } from './enum/datasource.enum';
import { InjectModel } from '@nestjs/mongoose';
import { Group } from './schemas/target-group.schema';
import { Model } from 'mongoose';

@Injectable()
export class SmaGroupsService {
  constructor(
    @InjectModel(Group.name) private readonly groupModel: Model<Group>,
  ) {}

  async listGroups(args: {
    datasource?: Datasource;
    enable_analysor?: boolean;
    enable_fetcher?: boolean;
  }): Promise<Group[]> {
    return await this.groupModel.find(args);
  }

  async getGroup(datasource: Datasource, id: string): Promise<Group | null> {
    return await this.groupModel.findOne({ datasource, target_id: id });
  }

  async searchGroups(args: { keyword: string; datasource?: Datasource }) {
    const cond: Record<string, any> = {
      name: { $regex: '.*' + args.keyword + '.*' },
    };
    if (args.datasource) {
      cond.datasource = args.datasource;
    }
    return await this.groupModel.find(cond).limit(20);
  }
}
