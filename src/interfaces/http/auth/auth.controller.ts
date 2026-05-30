import { Controller, Get, Post, Patch, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Audit } from '../../../infrastructure/audit/audit.decorator';
import { RegisterUseCase } from '../../../application/auth/use-cases/register.usecase';
import { LoginUseCase } from '../../../application/auth/use-cases/login.usecase';
import { RefreshUseCase } from '../../../application/auth/use-cases/refresh.usecase';
import { LogoutUseCase } from '../../../application/auth/use-cases/logout.usecase';
import { Setup2faUseCase } from '../../../application/auth/use-cases/setup-2fa.usecase';
import { Verify2faUseCase } from '../../../application/auth/use-cases/verify-2fa.usecase';
import { GetMeUseCase } from '../../../application/auth/use-cases/get-me.usecase';
import { UpdateProfileUseCase } from '../../../application/auth/use-cases/update-profile.usecase';
import { JwtAuthGuard } from '../../../infrastructure/security/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { Verify2faDto } from './dto/verify-2fa.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

// Auth endurece el límite global a 10 req/min por IP (anti brute-force en login/register)
@Throttle({ default: { ttl: 60_000, limit: 10 } })
@Controller('auth')
export class AuthController {
  constructor(
    private readonly register: RegisterUseCase,
    private readonly login: LoginUseCase,
    private readonly refresh: RefreshUseCase,
    private readonly logout: LogoutUseCase,
    private readonly setup2fa: Setup2faUseCase,
    private readonly verify2fa: Verify2faUseCase,
    private readonly getMe: GetMeUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
  ) {}

  @Post('register')
  handleRegister(@Body() dto: RegisterDto) {
    return this.register.execute(dto.email, dto.password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  handleLogin(@Body() dto: LoginDto) {
    return this.login.execute(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  handleRefresh(@Body() dto: RefreshDto) {
    return this.refresh.execute(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @Audit({ action: 'LOGOUT', resource: 'auth' })
  @HttpCode(HttpStatus.NO_CONTENT)
  handleLogout(@Body() dto: RefreshDto) {
    return this.logout.execute(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  handleMe(@CurrentUser() user: { id: string }) {
    return this.getMe.execute(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  handleUpdateProfile(@CurrentUser() user: { id: string }, @Body() dto: UpdateProfileDto) {
    return this.updateProfile.execute({ userId: user.id, ...dto });
  }

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  handleSetup2fa(@CurrentUser() user: { id: string }) {
    return this.setup2fa.execute(user.id);
  }

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  handleVerify2fa(@CurrentUser() user: { id: string }, @Body() dto: Verify2faDto) {
    return this.verify2fa.execute(user.id, dto.token);
  }
}
