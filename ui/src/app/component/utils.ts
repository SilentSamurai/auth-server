export class Util {
    public static parseBoolean(value: string): boolean {
        const lowerCaseStr = value.toLowerCase();
        return lowerCaseStr === 'true';
    }
}
