import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RegisterUseCase } from '../../../application/auth/use-cases/register.usecase';
import { LoginUseCase } from '../../../application/auth/use-cases/login.usecase';
import { RefreshUseCase } from '../../../application/auth/use-cases/refresh.usecase';
import { LogoutUseCase } from '../../../application/auth/use-cases/logout.usecase';
import { Setup2faUseCase } from '../../../application/auth/use-cases/setup-2fa.usecase';
import { Verify2faUseCase } from '../../../application/auth/use-cases/verify-2fa.usecase';
import { JwtAuthGuard } from '../../../infrastructure/security/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { Verify2faDto } from './dto/verify-2fa.dto';

// Login y register usan el throttle estricto: 10 req/min por IP
// Previene brute force sin afectar uso normal
@Throttle({ strict: { ttl: 60_000, limit: 10 } })
@Controller('auth')
export class AuthController {
  constructor(
    private readonly register: RegisterUseCase,
    private readonly login: LoginUseCase,
    private readonly refresh: RefreshUseCase,
    private readonly logout: LogoutUseCase,
    private readonly setup2fa: Setup2faUseCase,
    private readonly verify2fa: Verify2faUseCase,
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
  @HttpCode(HttpStatus.NO_CONTENT)
  handleLogout(@Body() dto: RefreshDto) {
    return this.logout.execute(dto.refreshToken);
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
