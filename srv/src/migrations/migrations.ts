import {CreateInitialTables1681147242561} from "./1681147242561-initial-creation";
import {SessionMigration1684308185392} from "./1684308185392-session-migration";
import {Migrations1718012430697} from "./1718012430697-migrations";
import {CreateAuthorizationTable1698765432100} from "./CreateAuthorizationTable1698765432100";


export const migrations = [
    CreateInitialTables1681147242561,
    SessionMigration1684308185392,
    Migrations1718012430697,
    CreateAuthorizationTable1698765432100
]