
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';


export type CatDocument = HydratedDocument<Authorization>;

@Schema()
export class Authorization {

    // @Prop()
    // id: string;

    @Prop()
    role_id: string;

    @Prop()
    role_name: string;

    @Prop()
    tenant_id: string;

    @Prop()
    tenant_domain: string;

    @Prop()
    action: string;

    @Prop()
    subject: string;

    @Prop({type: Object })
    conditions: object;
}

export const authorizationSchema = SchemaFactory.createForClass(Authorization);

authorizationSchema.index({ role_id: 1 }, { unique: false });
authorizationSchema.index({ role_name: 1, tenant_id: 1 }, { unique: false });
authorizationSchema.index({ role_name: 1, tenant_domain: 1 }, { unique: false });