import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";

import { User } from "../entity/user.entity";
import { UsersService } from "../services/users.service";
import { AuthService } from "../auth/auth.service";
import { MailService } from "../mail/mail.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ValidationPipe } from "../validation/validation.pipe";
import { ValidationSchema } from "../validation/validation.schema";
import { TenantService } from "../services/tenant.service";
import { Tenant } from "../entity/tenant.entity";
import { SecurityService } from "../casl/security.service";

@Controller("api/users")
@UseInterceptors(ClassSerializerInterceptor)
export class UsersAdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly tenantService: TenantService,
    private readonly mailService: MailService,
    private readonly securityService: SecurityService,
  ) {}

  @Post("/create")
  @UseGuards(JwtAuthGuard)
  async createUser(
    @Request() request,
    @Body(new ValidationPipe(ValidationSchema.CreateUserSchema))
    body: {
      name: string;
      email: string;
      password: string;
    },
  ): Promise<User> {
    let user: User = await this.usersService.create(
      request,
      body.password,
      body.email,
      body.name,
    );

    await this.usersService.updateVerified(request, user.id, true);
    return user;
  }

  @Put("/update")
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Request() request,
    @Body(new ValidationPipe(ValidationSchema.UpdateUserSchema))
    body: {
      id: string;
      name: string;
      email: string;
      password: string;
    },
  ): Promise<User> {
    let user: User = await this.usersService.update(
      request,
      body.id,
      body.name,
      body.email,
      body.password,
    );

    return user;
  }

  @Get("/:userId")
  @UseGuards(JwtAuthGuard)
  async getUser(
    @Request() request,
    @Param("userId") userId: string,
  ): Promise<any> {
    const user: User = await this.usersService.findById(request, userId);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      verified: user.verified,
    };
  }

  @Get("")
  @UseGuards(JwtAuthGuard)
  async getUsers(@Request() request): Promise<User[]> {
    return await this.usersService.getAll(request);
  }

  @Delete("/:id")
  @UseGuards(JwtAuthGuard)
  async deleteUser(@Request() request, @Param("id") id: string): Promise<User> {
    return await this.usersService.delete(request, id);
  }

  @Get("/:userId/tenants")
  @UseGuards(JwtAuthGuard)
  async getTenants(
    @Request() request,
    @Param("userId") userId: string,
  ): Promise<Tenant[]> {
    const user: User = await this.usersService.findById(request, userId);
    return this.tenantService.findByMembership(request, user);
  }

  @Put("/verify-user")
  @UseGuards(JwtAuthGuard)
  async updateVerification(
    @Request() request,
    @Body(new ValidationPipe(ValidationSchema.verifyUser))
    body: {
      email: string;
      verify: boolean;
    },
  ): Promise<User> {
    let user: User = await this.usersService.findByEmail(request, body.email);

    return await this.usersService.updateVerified(
      request,
      user.id,
      body.verify,
    );
  }
}
