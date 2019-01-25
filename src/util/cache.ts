export class PriorityCache<V = any> {
  store: {
    [key: string]: {
      value: V,
      start: number,
      cost: number,
      demand: number,
      size: number,
    }
  } = {}
  size: number = 0
  maxSize: number = 0

  constructor(maxSize: number) {
    this.maxSize = maxSize
  }

  get(key: string): V | undefined {
    const val = this.store[key]
    if (val !== undefined) {
      val.demand += 1
      return val.value
    }
    return undefined
  }

  put(key: string, value: V, options: { size: number, cost: number }) {
    this.store[key] = {
      demand: 1,
      start: Date.now(),
      cost: options.cost,
      size: options.size,
      value: value,
    }
    this.size += options.size
    this.update()
  }

  remove(key: string) {
    delete this.store[key].value
    this.size -= this.store[key].size
    delete this.store[key]
  }

  update() {
    const now: number = Date.now()
    const ordered = Object.keys(this.store).sort(
      (a, b) => {
        const score_a = this.store[a].cost * this.store[a].demand / (now - this.store[a].start)
        const score_b = this.store[b].cost * this.store[b].demand / (now - this.store[b].start)
        return score_a - score_b
      }
    )

    while (this.size > this.maxSize) {
      const lowest = ordered.shift()
      if (lowest === undefined)
        break
      this.remove(lowest)
    }
  }
}
