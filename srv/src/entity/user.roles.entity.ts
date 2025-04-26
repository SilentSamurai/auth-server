import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "user_roles" })
export class UserRole {
  @PrimaryColumn({ name: "tenant_id" })
  tenantId: string;

  @PrimaryColumn({ name: "user_id" })
  userId: string;

  @PrimaryColumn({ name: "role_id" })
  roleId: string;

  @Column({ name: "from_group", nullable: false, default: false })
  from_group: boolean;
}
