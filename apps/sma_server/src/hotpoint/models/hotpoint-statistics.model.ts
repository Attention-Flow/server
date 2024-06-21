import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class HotpointStatistics {
    @Field(()=>Float, {nullable: true})
    weekIncr?: number;
    @Field(()=>Float, {nullable: true})
    monthIncr?: number;
    @Field(()=>Float, {nullable: true})
    dayIncr?: number;
    @Field(()=>Float, {nullable: true})
    hourIncr?: number;
}
