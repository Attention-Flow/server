import {
  Controller,
  Get,
  Logger,
  Redirect,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { GoogleUserDTO } from './dto/google-user.dto';

import { GoogleOAuthGuard } from './google-oauth.guard';
import { UserService } from '../user/user.service';

@Controller('auth')
export class AuthController {
  private logger = new Logger(AuthController.name);

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Redirect('/', 302)
  @Get('google-redirect')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthRedirect(@Request() req) {
    // console.log(req);

    const googleUser = req.user as GoogleUserDTO;
    this.logger.verbose(`google login: ${googleUser.id}`);

    this.logger.verbose(`check google user bound account ...`);
    let user = await this.userService.getUserViaGoogleId(googleUser.id);
    // console.log(user);
    if (!user) {
      this.logger.verbose(`create user and bind google account`);
      user = await this.userService.createUser({ userGoogle: googleUser });
    } else {
      this.logger.verbose(`update user and google info`);
      await this.userService.updateUserGoogle({
        id: user.id,
        data: googleUser,
      });
    }

    // generate token
    const EXPIRES_IN = 3600 * 24 * 7;
    const expireAt =
      EXPIRES_IN + parseInt((new Date().valueOf() / 1000).toString());
    const token = await this.authService.generateToken(user.id, {
      expiresIn: EXPIRES_IN,
    });

    const RESULT_URL = this.configService.get('GOOGLE_LOGIN_RESULT_URL');
    this.logger.verbose(`redirect ${RESULT_URL}`);
    return {
      url: RESULT_URL.replace('{TOKEN}', token).replace(
        '{EXPIRE_AT}',
        expireAt,
      ),
    };
  }
}
