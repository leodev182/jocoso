import * as crypto from 'crypto';

export enum ConcursoEstado {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED',
}

export interface ConcursoProps {
  id: string;
  titulo: string;
  estado: ConcursoEstado;
  montoMinimo: number;
  fechaDesde: Date;
  fechaHasta: Date | null;
  reglas: string;
  legal: string;
  imagenPromoUrl: string | null;
  imagenPromoActiva: boolean;
  resultadoVisible: boolean;
  ganadorOrdenId: string | null;
  permiteMultiplesParticipaciones: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
}

const TRANSITIONS: Partial<Record<ConcursoEstado, ConcursoEstado[]>> = {
  [ConcursoEstado.DRAFT]: [ConcursoEstado.ACTIVE],
  [ConcursoEstado.ACTIVE]: [ConcursoEstado.FINISHED],
};

export class Concurso {
  private constructor(
    private readonly id: string,
    private titulo: string,
    private estado: ConcursoEstado,
    private montoMinimo: number,
    private fechaDesde: Date,
    private fechaHasta: Date | null,
    private reglas: string,
    private legal: string,
    private imagenPromoUrl: string | null,
    private imagenPromoActiva: boolean,
    private resultadoVisible: boolean,
    private ganadorOrdenId: string | null,
    private permiteMultiplesParticipaciones: boolean,
    private readonly creadoEn: Date,
    private actualizadoEn: Date,
  ) {}

  static create(props: Omit<ConcursoProps, 'id' | 'estado' | 'resultadoVisible' | 'ganadorOrdenId' | 'creadoEn' | 'actualizadoEn'>): Concurso {
    const now = new Date();
    return new Concurso(
      crypto.randomUUID(), props.titulo, ConcursoEstado.DRAFT,
      props.montoMinimo, props.fechaDesde, props.fechaHasta,
      props.reglas, props.legal, props.imagenPromoUrl,
      props.imagenPromoActiva, false, null,
      props.permiteMultiplesParticipaciones, now, now,
    );
  }

  static reconstitute(props: ConcursoProps): Concurso {
    return new Concurso(
      props.id, props.titulo, props.estado, props.montoMinimo,
      props.fechaDesde, props.fechaHasta, props.reglas, props.legal,
      props.imagenPromoUrl, props.imagenPromoActiva, props.resultadoVisible,
      props.ganadorOrdenId, props.permiteMultiplesParticipaciones,
      props.creadoEn, props.actualizadoEn,
    );
  }

  getId(): string { return this.id; }
  getTitulo(): string { return this.titulo; }
  getEstado(): ConcursoEstado { return this.estado; }
  getMontoMinimo(): number { return this.montoMinimo; }
  getFechaDesde(): Date { return this.fechaDesde; }
  getFechaHasta(): Date | null { return this.fechaHasta; }
  getReglas(): string { return this.reglas; }
  getLegal(): string { return this.legal; }
  getImagenPromoUrl(): string | null { return this.imagenPromoUrl; }
  isImagenPromoActiva(): boolean { return this.imagenPromoActiva; }
  isResultadoVisible(): boolean { return this.resultadoVisible; }
  getGanadorOrdenId(): string | null { return this.ganadorOrdenId; }
  permiteMultiples(): boolean { return this.permiteMultiplesParticipaciones; }
  getCreadoEn(): Date { return this.creadoEn; }

  update(fields: Partial<Omit<ConcursoProps, 'id' | 'estado' | 'creadoEn' | 'actualizadoEn'>>): void {
    if (fields.titulo !== undefined) this.titulo = fields.titulo;
    if (fields.montoMinimo !== undefined) this.montoMinimo = fields.montoMinimo;
    if (fields.fechaDesde !== undefined) this.fechaDesde = fields.fechaDesde;
    if (fields.fechaHasta !== undefined) this.fechaHasta = fields.fechaHasta;
    if (fields.reglas !== undefined) this.reglas = fields.reglas;
    if (fields.legal !== undefined) this.legal = fields.legal;
    if (fields.imagenPromoUrl !== undefined) this.imagenPromoUrl = fields.imagenPromoUrl;
    if (fields.imagenPromoActiva !== undefined) this.imagenPromoActiva = fields.imagenPromoActiva;
    if (fields.permiteMultiplesParticipaciones !== undefined) this.permiteMultiplesParticipaciones = fields.permiteMultiplesParticipaciones;
    if (fields.resultadoVisible !== undefined) this.resultadoVisible = fields.resultadoVisible;
    if (fields.ganadorOrdenId !== undefined) this.ganadorOrdenId = fields.ganadorOrdenId;
    this.touch();
  }

  activar(): void { this.transition(ConcursoEstado.ACTIVE); }
  finalizar(): void { this.transition(ConcursoEstado.FINISHED); }

  setGanador(ordenId: string): void {
    this.ganadorOrdenId = ordenId;
    this.resultadoVisible = true;
    this.touch();
  }

  private transition(next: ConcursoEstado): void {
    const allowed = TRANSITIONS[this.estado] ?? [];
    if (!allowed.includes(next)) {
      throw new Error(`Transición inválida: ${this.estado} → ${next}`);
    }
    this.estado = next;
    this.touch();
  }

  private touch(): void { this.actualizadoEn = new Date(); }

  toPersistence(): ConcursoProps {
    return {
      id: this.id, titulo: this.titulo, estado: this.estado,
      montoMinimo: this.montoMinimo, fechaDesde: this.fechaDesde,
      fechaHasta: this.fechaHasta, reglas: this.reglas, legal: this.legal,
      imagenPromoUrl: this.imagenPromoUrl, imagenPromoActiva: this.imagenPromoActiva,
      resultadoVisible: this.resultadoVisible, ganadorOrdenId: this.ganadorOrdenId,
      permiteMultiplesParticipaciones: this.permiteMultiplesParticipaciones,
      creadoEn: this.creadoEn, actualizadoEn: this.actualizadoEn,
    };
  }
}
