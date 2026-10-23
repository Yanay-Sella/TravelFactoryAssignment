import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum UserRole {
	Requester = "Requester",
	Validator = "Validator",
}

// Column types are declared explicitly so the entity never relies on decorator
// metadata, which esbuild does not emit (see LAYERS.md, layer 0).
@Entity("users")
export class User {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "varchar", length: 120 })
	name!: string;

	@Column({ type: "varchar", length: 180, unique: true })
	email!: string;

	@Column({ type: "varchar" })
	password!: string;

	@Column({ type: "enum", enum: UserRole })
	role!: UserRole;

	@CreateDateColumn({ name: "created_at", type: "timestamptz" })
	createdAt!: Date;
}
