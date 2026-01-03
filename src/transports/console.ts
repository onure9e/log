import { Transport } from './base';
import { LogMessage, LogLevel } from '../logger';

let easycolor: any;
function getEasyColor(): any {
  if (!easycolor) easycolor = require('@onurege3467/easycolor');
  return easycolor;
}

export class ConsoleTransport implements Transport {
  constructor(private options: { levels: { [key: string]: LogLevel } } = { levels: {} }) {}

  public log(message: LogMessage): void {
    const level = this.options.levels[message.level];
    if (!level) return;

    const ec = getEasyColor();
    
    // Build string parts for speed
    let out = '';
    
    if (message.prefix) {
      out += ec.cyan('[' + message.prefix + '] ');
    }

    const levelText = level.symbol ? level.symbol + ' ' + level.name.toUpperCase() : level.name.toUpperCase();
    const colorFn = ec[level.color] || ((t: string) => t);
    out += '[' + colorFn(levelText) + '] ';

    out += ec.brightBlack('[' + message.timestamp + '] ');
    out += message.message;

    if (message.metadata) {
      out += ec.brightBlack(' | ' + JSON.stringify(message.metadata));
    }

    process.stdout.write(out + '\n');
  }
}