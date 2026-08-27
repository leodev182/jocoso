import * as crypto from 'crypto';

export interface ParticipacionProps {
  id: string;
  concursoId: string;
  ordenId: string;
  usuarioId: string;
  creadoEn: Date;
}

export class Participacion {
  private constructor(
    private readonly id: string,
    private readonly concursoId: string,
    private readonly ordenId: string,
    private readonly usuarioId: string,
    private readonly creadoEn: Date,
  ) {}

  static create(concursoId: string, ordenId: string, usuarioId: string): Participacion {
    return new Participacion(crypto.randomUUID(), concursoId, ordenId, usuarioId, new Date());
  }

  static reconstitute(props: ParticipacionProps): Participacion {
    return new Participacion(props.id, props.concursoId, props.ordenId, props.usuarioId, props.creadoEn);
  }

  getId(): string { return this.id; }
  getConcursoId(): string { return this.concursoId; }
  getOrdenId(): string { return this.ordenId; }
  getUsuarioId(): string { return this.usuarioId; }
  getCreadoEn(): Date { return this.creadoEn; }

  toPersistence(): ParticipacionProps {
    return { id: this.id, concursoId: this.concursoId, ordenId: this.ordenId, usuarioId: this.usuarioId, creadoEn: this.creadoEn };
  }
}
