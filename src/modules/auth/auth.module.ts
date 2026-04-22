import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Domain
import { AuthDomainService } from '../../domain/auth/services/auth.domain.service';
import { USER_REPOSITORY } from '../../domain/auth/repositories/user.repository';
import { REFRESH_TOKEN_REPOSITORY } from '../../domain/auth/repositories/refresh-token.repository';

// Application
import { RegisterUseCase } from '../../application/auth/use-cases/register.usecase';
import { LoginUseCase } from '../../application/auth/use-cases/login.usecase';
import { RefreshUseCase } from '../../application/auth/use-cases/refresh.usecase';
import { LogoutUseCase } from '../../application/auth/use-cases/logout.usecase';
import { Setup2faUseCase } from '../../application/auth/use-cases/setup-2fa.usecase';
import { Verify2faUseCase } from '../../application/auth/use-cases/verify-2fa.usecase';
import { TOKEN_SERVICE } from '../../application/auth/ports/token.service';

// Infrastructure
import { UserPrismaRepository } from '../../infrastructure/auth/user.prisma-repo';
import { RefreshTokenPrismaRepository } from '../../infrastructure/auth/refresh-token.prisma-repo';
import { BcryptService } from '../../infrastructure/security/bcrypt.service';
import { TotpService } from '../../infrastructure/security/totp.service';
import { JwtTokenService } from '../../infrastructure/security/jwt/jwt-token.service';
import { JwtStrategy } from '../../infrastructure/security/jwt/jwt.strategy';

// Interfaces
import { AuthController } from '../../interfaces/http/auth/auth.controller';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Domain
    AuthDomainService,

    // Application use cases
    RegisterUseCase,
    LoginUseCase,
    RefreshUseCase,
    LogoutUseCase,
    Setup2faUseCase,
    Verify2faUseCase,

    // Infrastructure — bind interfaces to implementations
    { provide: USER_REPOSITORY, useClass: UserPrismaRepository },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: RefreshTokenPrismaRepository },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },

    // Infrastructure services
    BcryptService,
    TotpService,
    JwtTokenService,
    JwtStrategy,
  ],
  exports: [JwtModule],
})
export class AuthModule {}
