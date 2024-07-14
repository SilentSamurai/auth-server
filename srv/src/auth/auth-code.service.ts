import {Injectable, Logger} from '@nestjs/common';
import {ConfigService} from '../config/config.service';
import {UsersService} from '../services/users.service';
import {JwtService} from '@nestjs/jwt';
import {TenantService} from "../services/tenant.service";
import {NotFoundException} from "../exceptions/not-found.exception";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {AuthCode} from "../entity/auth_code.entity";
import {User} from "../entity/user.entity";
import {Tenant} from "../entity/tenant.entity";
import {CryptUtil} from "../util/crypt.util";
import {InvalidCredentialsException} from "../exceptions/invalid-credentials.exception";
import {Cron} from "@nestjs/schedule";
import * as ms from 'ms';


@Injectable()
export class AuthCodeService {

    private readonly LOGGER = new Logger("AuthCodeService");

    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly tenantService: TenantService,
        private readonly jwtService: JwtService,
        @InjectRepository(AuthCode) private authCodeRepository: Repository<AuthCode>
    ) {
    }


    async existByCode(code: string): Promise<boolean> {
        return this.authCodeRepository.exist({
            where: {code}
        });
    }

    async findByCode(code: string): Promise<AuthCode> {
        let session = await this.authCodeRepository.findOne({
            where: {code: code}
        });
        if (session === null) {
            throw new NotFoundException("auth code not found");
        }
        return session;
    }

    /**
     * Create a verification token for the user.
     */
    async createAuthToken(user: User, tenant: Tenant, code_challenge: string): Promise<string> {
        let roles = await this.tenantService.getMemberRoles(tenant.id, user);

        let code = CryptUtil.generateOTP(6);

        if (await this.existByCode(code)) {
            code = CryptUtil.generateRandomString(16);
        }

        let session = this.authCodeRepository.create({
            codeChallenge: code_challenge,
            code: code,
            tenantId: tenant.id,
            userId: user.id,
        });

        session = await this.authCodeRepository.save(session);
        return session.code;
    }

    async validateAuthCode(code: string, codeVerifier: string) {
        let session = await this.findByCode(code);
        let tenant = await this.tenantService.findById(session.tenantId);
        let user = await this.usersService.findById(session.userId);
        let genChallenge = CryptUtil.generateCodeChallenge(codeVerifier);
        if (genChallenge !== session.codeChallenge && codeVerifier !== session.codeChallenge) {
            throw new InvalidCredentialsException();
        }
        return {tenant, user};
    }

    /**
     * Delete the expired not verified users.
     */
    @Cron('0 1 * * * *') // Every hour, at the start of the 1st minute.
    async deleteExpiredNotVerifiedUsers() {
        this.LOGGER.log('Delete expired auth codes');

        const now: Date = new Date();
        const expirationTime: any = this.configService.get('TOKEN_EXPIRATION_TIME');

        const authCodes: AuthCode[] = await this.authCodeRepository.find();
        for (let i = 0; i < authCodes.length; i++) {
            const authCode: AuthCode = authCodes[i];
            const createDate: Date = new Date(authCode.createdAt);
            const expirationDate: Date = new Date(createDate.getTime() + ms(expirationTime));

            if (now > expirationDate) {
                try {
                    await this.authCodeRepository.delete(authCode.code);
                    this.LOGGER.log('auth codes ' + authCode.code + ' deleted');
                } catch (exception) {
                }
            }
        }
    }


}
