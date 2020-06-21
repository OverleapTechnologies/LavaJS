export class Cache<K, V> extends Map<K, V> {
  /**
   * Creates a new Cache
   * @extends Map
   */
  constructor() {
    super();
  }

  /**
   * Get the first entry
   * @return {V}
   */
  public get first(): V {
    return this.values().next().value;
  }

  /**
   * Get the last entry
   * @return {V}
   */
  public get last(): V {
    const arr: V[] = this.toArray();
    return arr[arr.length - 1];
  }

  /**
   * Get n number of entries from the start or end
   * @param {Number} [amount] - The amount of data to retrieve.
   * @param {String} position - Whether to get data from start or end.
   * @return {Array<V>}
   */
  public getSome(amount: number, position: "start" | "end"): V[] | undefined {
    const arr: V[] = this.toArray();
    if (position === "start") {
      return arr.slice(amount);
    } else if (position === "end") {
      return arr.slice(-amount);
    }
  }

  /**
   * Convert all the cache values into an array
   * @return {Array<V>}
   */
  public toArray(): V[] {
    return [...this.values()];
  }

  /**
   * Convert the cache into an array of [K, V] pairs
   * @return {Array<Array<K, V>>}
   */
  public KVArray(): [K, V][] {
    return [...this.entries()];
  }

  /**
   * Allows you to use Array.map() on Cache
   * @param {Function} func - The function to execute on each element.
   * @return {Array<T>}
   */
  public map<T>(func: (value: V, key: K) => T): T[] {
    const mapIter: IterableIterator<[K, V]> = this.entries();
    return Array.from(
      { length: this.size },
      (): T => {
        const [key, val]: [K, V] = mapIter.next().value;
        return func(val, key);
      }
    );
  }
}
