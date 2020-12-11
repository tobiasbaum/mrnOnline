export class StorageStub implements Storage {
    private data = new Map<string, string>();

    clear(): void {
        this.data.clear();
    }

    getItem(key: string): string | null {
        return this.data.get(key) ?? null;
    }

    key(index: number): string | null {
        let keys = Array.from(this.data.keys());
        return keys[index];
    }

    removeItem(key: string): void {
        this.data.delete(key);
    }

    setItem(key: string, value: string): void {
        this.data.set(key, value);
    }
    
    get length(): number {
        return this.data.size;
    }
}