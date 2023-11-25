import glob from 'glob';

export default class FileSystem {
    public static glob(pattern: string, options: any): Promise<Array<string>> {
        return new Promise((resolve, reject) => {
            glob(pattern, options, (error: Error | null, files: Array<string>) => {
                if (error) {
                    reject(error);
                }

                resolve(files);
            });
        });
    }
}
