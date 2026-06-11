import type { Entity } from '../entities/components';

/** Circle-vs-circle collision checks over entity colliders. */
export class CollisionSystem {
  static overlaps(a: Entity, b: Entity): boolean {
    const dx = a.position.x - b.position.x;
    const dy = a.position.y - b.position.y;
    const rr = a.collider.radius + b.collider.radius;
    return dx * dx + dy * dy <= rr * rr;
  }

  /**
   * Pair each live entity in `projectiles` with the first live entity in
   * `targets` it overlaps. The callback may mutate alive flags; dead
   * entities are skipped for subsequent pairs.
   */
  static forEachHit<P extends Entity, T extends Entity>(
    projectiles: readonly P[],
    targets: readonly T[],
    onHit: (projectile: P, target: T) => void,
  ): void {
    for (const projectile of projectiles) {
      if (!projectile.alive) continue;
      for (const target of targets) {
        if (!target.alive) continue;
        if (CollisionSystem.overlaps(projectile, target)) {
          onHit(projectile, target);
          break;
        }
      }
    }
  }

  /** First live target overlapping `entity`, or null. */
  static firstHit<T extends Entity>(entity: Entity, targets: readonly T[]): T | null {
    for (const target of targets) {
      if (target.alive && CollisionSystem.overlaps(entity, target)) return target;
    }
    return null;
  }
}
