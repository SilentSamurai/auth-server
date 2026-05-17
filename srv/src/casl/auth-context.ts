import {AnyAbility} from "@casl/ability/dist/types/PureAbility";
import {Token} from "./token-types";

export class AuthContext {
    SCOPE_ABILITIES: AnyAbility;
    SECURITY_CONTEXT: Token;
}
