import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { User } from "./User";

export enum VacationStatus {
	Pending = "Pending",
	Approved = "Approved",
	Rejected = "Rejected",
}

// start_date / end_date are `date` columns, so the driver returns them as "YYYY-MM-DD"
// strings: vacations are whole days and must not pick up a timezone offset.
// The composite index serves both the overlap check and the per-user listing.
@Entity("vacation_requests")
@Index(["userId", "startDate"])
export class VacationRequest {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ name: "user_id", type: "uuid" })
	userId!: string;

	@ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
	@JoinColumn({ name: "user_id" })
	user!: User;

	@Column({ name: "start_date", type: "date" })
	startDate!: string;

	@Column({ name: "end_date", type: "date" })
	endDate!: string;

	@Column({ type: "text", nullable: true })
	reason!: string | null;

	@Column({ type: "enum", enum: VacationStatus, default: VacationStatus.Pending })
	status!: VacationStatus;

	@Column({ type: "text", nullable: true })
	comments!: string | null;

	@CreateDateColumn({ name: "created_at", type: "timestamptz" })
	createdAt!: Date;

	@UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
	updatedAt!: Date;
}
