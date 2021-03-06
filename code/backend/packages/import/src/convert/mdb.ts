import { spawn } from 'child_process';
import { Stream } from 'stream';
import { access } from 'fs';

export class Mdb extends Stream {
  private _file: string;
  private _tableDelimiter: string;

  constructor(file: string) {
    super();
    this._file = file;
    this._tableDelimiter = ',';
  }

  toCsv(table: string): Promise<string> {
    return new Promise((resolve, reject) => {
      access(this._file, fileError => {
        if (!fileError) {
          const cmd = spawn('mdb-export', [this._file, table]);

          let data = '';

          cmd.stdout.on('data', result => {
            data += result.toString();
          });

          cmd.stdout.on('end', () => {
            if (data === null || data === undefined || data.length === 0) {
              reject({
                message: 'no data',
                arguments: {
                  file: this._file
                }
              });
            } else {
              resolve(data);
            }
          });

          cmd.stderr.on('error', readError => {
            reject(readError);
          });
        } else {
          reject({
            message: "Couldn't find file.",
            arguments: {
              file: this._file
            }
          });
        }
      });
    });
  }

  tables() {
    return new Promise((resolve, reject) => {
      access(this._file, fileError => {
        if (!fileError) {
          const cmd = spawn('mdb-tables_lol', ['--delimiter=' + this._tableDelimiter, this._file]);
          cmd.stdout.on('data', result => {
            const tables = result
              .toString()
              .replace(/,\n$/, '')
              .split(this._tableDelimiter);
            resolve(tables);
          });

          cmd.stderr.on('data', readError => {
            reject(readError);
          });
        } else {
          reject({
            message: "Couldn't find file.",
            arguments: {
              file: this._file,
              curDir: __dirname
            }
          });
        }
      });
    });
  }
}
