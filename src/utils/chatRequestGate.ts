// Each request belongs to the identity and history generation in which it began.
// Clearing data or switching accounts invalidates outstanding replies.
export class ChatRequestGate {
  private generation = 0
  private inFlight = false

  begin(): number | null {
    if (this.inFlight) return null
    this.inFlight = true
    return this.generation
  }

  isCurrent(generation: number): boolean {
    return generation === this.generation
  }

  finish(generation: number): void {
    if (this.isCurrent(generation)) this.inFlight = false
  }

  invalidate(): void {
    this.generation += 1
    this.inFlight = false
  }
}
