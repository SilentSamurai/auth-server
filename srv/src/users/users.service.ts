import {forwardRef, Inject, Injectable, Logger, OnModuleInit} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Cron} from '@nestjs/schedule';
import {User} from './user.entity';
import {ConfigService} from '../config/config.service';
import {RolesService} from '../roles/roles.service';
import {UsernameTakenException} from '../exceptions/username-taken.exception';
import {EmailTakenException} from '../exceptions/email-taken.exception';
import {UserNotFoundException} from '../exceptions/user-not-found.exception';
import {InvalidCredentialsException} from '../exceptions/invalid-credentials.exception';
import * as argon2 from 'argon2';
import * as ms from 'ms';
import {Scope} from "../tenants/scope.entity";
import {Tenant} from 'src/tenants/tenant.entity';

const fs = require('fs');

@Injectable()
export class UsersService implements OnModuleInit {

    private readonly cronLogger = new Logger("CRON");

    constructor(
        @InjectRepository(User) private usersRepository: Repository<User>,
        private readonly configService: ConfigService,
        @Inject(forwardRef(() => RolesService)) private readonly rolesService: RolesService
    ) {
    }

    async onModuleInit() {
        if (!this.configService.isProduction()) {
            await this.populateDummyUsers();
        }
        await this.createAdminUser();
    }

    /**
     * Create a user.
     */
    async create(
        password: string,
        email: string,
        name: string,
        roles: string[] = ['user']
    ): Promise<User> {

        const emailTaken: User = await this.usersRepository.findOne({where: {email}});
        if (emailTaken) {
            throw new EmailTakenException();
        }

        let userRoles: any[] = [];
        for (let i in roles) {
            let role = await this.rolesService.getByName(roles[i]);
            if (role) {
                userRoles.push(role);
            }
        }

        const user: User = this.usersRepository.create({
            email: email,
            password: await argon2.hash(password),
            name: name,
            roles: userRoles
        });

        return this.usersRepository.save(user);
    }

    /**
     * Get all the users.
     */
    async getAll(): Promise<User[]> {
        return await this.usersRepository.find();
    }

    /**
     * Get all the not verified users.
     * Roles relation is not returned.
     */
    async findByNotVerified(): Promise<User[]> {
        return await this.usersRepository.createQueryBuilder('user').select('*').where('verified = false').execute();
    }

    /**
     * Get a user by id.
     */
    async findById(
        id: string
    ): Promise<User> {
        const user: User = await this.usersRepository.findOne({
            where: {id: id},
            relations: {
                roles: true
            }
        });
        if (user === null) {
            throw new UserNotFoundException();
        }

        return user;
    }

    /**
     * Get a user by email.
     */
    async findByEmail(
        email: string
    ): Promise<User> {
        const user: User = await this.usersRepository.findOne({
            where: {email},
            relations: {
                roles: true
            }
        });
        if (user === null) {
            throw new UserNotFoundException();
        }

        return user;
    }

    async findByTenant(tenant: Tenant): Promise<User[]> {
        const users: User[] = await this.usersRepository.find({
            where: {
                tenants: {id: tenant.id}
            },
            relations: {
                scopes: true
            }
        });
        return users;
    }

    /**
     * Update the user.
     */
    async update(
        id: string,
        name: string,
        email: string,
        password: string
    ): Promise<User> {
        const user: User = await this.findById(id);

        if (email !== null) {
            const emailTaken = await this.usersRepository.findOne({where: {email}});
            if (emailTaken) {
                throw new EmailTakenException();
            }
            user.email = email;
        }
        if (password !== null) {
            user.password = await argon2.hash(password);
        }
        user.name = name || user.name;
        return await this.usersRepository.save(user);
    }

    /**
     * Update the user's username if the password is verified.
     */
    async updateEmailSecure(
        id: string,
        email: string,
        password: string
    ): Promise<User> {
        const user: User = await this.findById(id);

        const valid: boolean = await argon2.verify(user.password, password);
        if (!valid) {
            throw new InvalidCredentialsException();
        }

        const emailTaken: User = await this.findByEmail(email);
        if (emailTaken) {
            throw new UsernameTakenException();
        }

        user.email = email;

        return await this.usersRepository.save(user);
    }

    /**
     * Update the user's email.
     */
    async updateEmail(
        id: string,
        email: string
    ): Promise<User> {
        const user: User = await this.findById(id);
        user.email = email;
        return await this.usersRepository.save(user);
    }

    /**
     * Update the user's password.
     */
    async updatePassword(
        id: string,
        password: string
    ): Promise<User> {
        const user: User = await this.findById(id);
        user.password = await argon2.hash(password);
        return await this.usersRepository.save(user);
    }

    /**
     * Update the user's password if the password is verified.
     */
    async updatePasswordSecure(
        id: string,
        currentPassword: string,
        newPassword: string
    ): Promise<User> {
        const user: User = await this.findById(id);
        const valid: boolean = await argon2.verify(user.password, currentPassword);
        if (!valid) {
            throw new InvalidCredentialsException();
        }
        user.password = await argon2.hash(newPassword);
        return await this.usersRepository.save(user);
    }

    /**
     * Update the user's name.
     */
    async updateName(
        id: string,
        name: string = ''
    ): Promise<User> {
        const user: User = await this.findById(id);
        user.name = name;
        return await this.usersRepository.save(user);
    }

    /**
     * Update the user's verified field.
     */
    async updateVerified(
        id: string,
        verified: boolean
    ): Promise<User> {
        const user: User = await this.findById(id);
        user.verified = verified;
        return await this.usersRepository.save(user);
    }

    /**
     * Delete the user.
     */
    async delete(
        id: string
    ): Promise<User> {
        const user: User = await this.findById(id);
        return await this.usersRepository.remove(user);
    }

    /**
     * Delete the user if the password is verified.
     */
    async deleteSecure(
        id: string,
        password: string
    ): Promise<User> {
        const user: User = await this.findById(id);
        const valid: boolean = await argon2.verify(user.password, password);
        if (!valid) {
            throw new InvalidCredentialsException();
        }
        return await this.usersRepository.remove(user);
    }

    /**
     * Delete the expired not verified users.
     */
    @Cron('0 1 * * * *') // Every hour, at the start of the 1st minute.
    async deleteExpiredNotVerifiedUsers() {
        this.cronLogger.log('Delete expired not verified users');

        const now: Date = new Date();
        const expirationTime: any = this.configService.get('TOKEN_VERIFICATION_EXPIRATION_TIME');

        const users: User[] = await this.findByNotVerified();
        for (let i = 0; i < users.length; i++) {
            const user: User = users[i];
            const createDate: Date = new Date(user.createdAt);
            const expirationDate: Date = new Date(createDate.getTime() + ms(expirationTime));

            if (now > expirationDate) {
                try {
                    this.delete(user.id);
                    this.cronLogger.log('User ' + user.email + ' deleted');
                } catch (exception) {
                }
            }
        }
    }

    /**
     * Populate the database with dummy users.
     */
    async populateDummyUsers() {
        fs.readFile('./users.json', 'utf8', (error, data) => {
            if (error) {
                return
            }

            const users: any = JSON.parse(data);
            users.records.forEach(async record => {
                try {
                    let user: User = await this.create(
                        record.password,
                        record.email,
                        record.name,
                        record.roles
                    );

                    await this.updateVerified(user.id, true);
                } catch (exception: any) {
                    // Catch user already created.
                }
            });
        });
    }

    async createAdminUser() {
        try {
            let user: User = await this.create(
                "admin9000",
                "admin@auth.server.com",
                "admin",
                ["admin", "user"]
            );

            await this.updateVerified(user.id, true);
        } catch (exception: any) {
            // Catch user already created.
        }
    }

    async countByScope(
        scope: Scope
    ): Promise<number> {
        const count: number = await this.usersRepository.count({
            where: {
                scopes: {id: scope.id}
            }, relations: {
                scopes: true
            }
        });
        return count;
    }

    async isUserAssignedToScope(scope: Scope) {
        let count = await this.countByScope(scope);
        return count > 0;
    }

    async countByTenant(tenant: Tenant): Promise<number> {
        return this.usersRepository.count({
            where: {
                tenants: {id: tenant.id}
            }
        });
    }
}
