import { LogMessage } from '../logger';

export interface Transport {
  log(message: LogMessage): void;
}
