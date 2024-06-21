import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleUserDTO } from './dto/google-user.dto';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    const clientId = configService.get('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get('GOOGLE_LOGIN_CALLBACK_URL');
    super({
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL: callbackURL,
      scope: ['profile', 'email'], // openid => refreshToken
      userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
    });
  }
  async validate(
    accessToken: string, // not used
    refreshToken: string, // not used
    profile: GoogleUserDTO,
    done: VerifyCallback,
  ): Promise<any> {
    done(null, profile);
  }
}
