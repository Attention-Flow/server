import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  // private logger = new Logger(AuthService.name);

  constructor(private jwtService: JwtService) {}

  async onModuleInit() {
    // console.log(
    //   await this.generateToken('ac61109b-3f4d-4a3a-a89f-7acb10540f53', {
    //     expiresIn: 60 * 60 * 24 * 7,
    //   }),
    // );
  }

  async generateToken(
    id: string,
    {
      expiresIn = 60 * 60 * 24 * 7, // 7days
    }: {
      expiresIn?: number;
    },
  ) {
    return await this.jwtService.signAsync({ id }, { expiresIn });
  }

  async decodeToken(token: string): Promise<{ id: string }> {
    return await this.jwtService.verifyAsync<{ id: string }>(token);
  }
}
