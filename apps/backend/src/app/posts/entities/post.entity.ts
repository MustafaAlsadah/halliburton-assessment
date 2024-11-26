import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.posts, {
    nullable: false,
    eager: false,
  })
  user: User;

  @Column()
  userId: number;

  @Column()
  title: string;

  @Column()
  content: string;

  @Column({ nullable: true })
  thumbnail: string;

  @Column({ default: false })
  containsRestricted: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  checkForRestrictedContent() {
    this.containsRestricted =
      this.hasRestrictedWords(this.content) ||
      this.hasRestrictedWords(this.title);
  }

  private hasRestrictedWords(text: string): boolean {
    const words = text.split(/\s+/);
    const restrictedPattern = /\b[A-Z][a-zA-Z]*[A-Z]\b/; // regex rep
    const containsRestricted = words.some((word) =>
      restrictedPattern.test(word)
    );
    return containsRestricted;
  }
}
