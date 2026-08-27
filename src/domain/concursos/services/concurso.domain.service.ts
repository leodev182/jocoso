import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { Concurso, ConcursoEstado } from '../entities/concurso.entity';
import { OrderOrigin } from '../../orders/entities/order.entity';

const MAX_ACTIVE = 3;
const MAX_FINISHED = 5;

@Injectable()
export class ConcursoDomainService {
  assertMaxActive(activeCount: number): void {
    if (activeCount >= MAX_ACTIVE) {
      throw new UnprocessableEntityException(`Máximo ${MAX_ACTIVE} concursos activos simultáneos`);
    }
  }

  assertCanDraw(concurso: Concurso): void {
    if (concurso.getEstado() !== ConcursoEstado.ACTIVE) {
      throw new UnprocessableEntityException('Solo se puede ejecutar la ruleta en un concurso ACTIVE');
    }
  }

  // Returns the oldest FINISHED concurso to purge if the limit is exceeded, otherwise null.
  getConcursoToPurge(finishedConcursos: Concurso[]): Concurso | null {
    if (finishedConcursos.length >= MAX_FINISHED) return finishedConcursos[0]; // oldest first
    return null;
  }

  qualifiesForConcurso(
    concurso: Concurso,
    order: { totalAmount: number; createdAt: Date; origin: OrderOrigin },
  ): boolean {
    if (order.origin === OrderOrigin.ML) return false;
    if (order.totalAmount < concurso.getMontoMinimo()) return false;
    if (order.createdAt < concurso.getFechaDesde()) return false;
    const hasta = concurso.getFechaHasta();
    if (hasta && order.createdAt > hasta) return false;
    return true;
  }

  pickWinner(participacionIds: string[]): string {
    if (participacionIds.length === 0) throw new UnprocessableEntityException('El concurso no tiene participantes');
    const idx = Math.floor(Math.random() * participacionIds.length);
    return participacionIds[idx];
  }
}
