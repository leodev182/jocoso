import * as crypto from 'crypto';

export interface TagProps {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Tag {
  private constructor(
    private readonly id: string,
    private name: string,
    private slug: string,
    private color: string | null,
    private isActive: boolean,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(name: string, slug: string, color?: string): Tag {
    const now = new Date();
    return new Tag(crypto.randomUUID(), name, slug, color ?? null, true, now, now);
  }

  static reconstitute(props: TagProps): Tag {
    return new Tag(props.id, props.name, props.slug, props.color, props.isActive, props.createdAt, props.updatedAt);
  }

  getId(): string { return this.id; }
  getName(): string { return this.name; }
  getSlug(): string { return this.slug; }
  getColor(): string | null { return this.color; }
  getIsActive(): boolean { return this.isActive; }

  deactivate(): void { this.isActive = false; this.touch(); }

  reactivate(name: string, color: string | null): void {
    this.name = name;
    this.color = color;
    this.isActive = true;
    this.touch();
  }

  private touch(): void { this.updatedAt = new Date(); }

  toPersistence(): TagProps {
    return { id: this.id, name: this.name, slug: this.slug, color: this.color, isActive: this.isActive, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
