export class Util {


    public static parseBoolean(value: string): boolean {
        const lowerCaseStr = value.toLowerCase();
        return lowerCaseStr === 'true';
    }


    public static getValueFromPath(obj: any, path: string): any {
        const pathArray = path.split('/').filter(part => part !== '');
        let current: any = obj;

        for (const part of pathArray) {
            if (Array.isArray(current)) {
                const index = parseInt(part, 10);
                if (isNaN(index)) {
                    return null;
                }
                current = current[index];
            } else if (typeof current === 'object' && current !== null) {
                current = current[part];
            } else {
                return null;
            }

            if (current === undefined) {
                return null;
            }
        }

        return current;
    }


    public static updateValueAtPath(obj: any, path: string, value: any): boolean {
        const pathArray = path.split('/').filter(part => part !== '');
        let current: any = obj;

        for (let i = 0; i < pathArray.length; i++) {
            const part = pathArray[i];

            if (i === pathArray.length - 1) {
                // If we are at the last part of the path, update the value
                if (Array.isArray(current)) {
                    const index = parseInt(part, 10);
                    if (isNaN(index)) {
                        throw new Error(`Invalid array index: ${part}`);
                    }
                    current[index] = value;
                } else if (typeof current === 'object' && current !== null) {
                    current[part] = value;
                } else {
                    return false;
                }
            } else {
                // Navigate deeper into the object/array
                if (Array.isArray(current)) {
                    const index = parseInt(part, 10);
                    if (isNaN(index)) {
                        throw new Error(`Invalid array index: ${part}`);
                    }
                    current = current[index];
                } else if (typeof current === 'object' && current !== null) {
                    if (!(part in current)) {
                        // Create the path if it doesn't exist
                        current[part] = {};
                    }
                    current = current[part];
                } else {
                    return false;
                }
            }

            if (current === undefined) {
                return false;
            }
        }

        return true;
    }


}


