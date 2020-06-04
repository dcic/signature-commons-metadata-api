import {bind, BindingScope} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import debug from '../util/debug';

@bind({scope: BindingScope.SINGLETON})
export class BackgroundProcessService {
  _status?: string;

  constructor() {
    this._status = undefined;
  }

  async isRunning() {
    return this._status !== undefined && this._status.indexOf('ERROR:') !== 0;
  }

  async getStatus() {
    if (this._status === undefined) {
      return 'Ready';
    } else {
      return this._status;
    }
  }

  async setStatus(v: string) {
    debug(`[background-process]: ${v}`);
    this._status = v;
  }

  async resetStatus() {
    this._status = undefined;
  }

  async spawn(callable: () => Promise<void>) {
    if (await this.isRunning()) {
      throw new HttpErrors.Conflict(
        `Summary.refresh already running: ${await this.getStatus()}`,
      );
    } else {
      try {
        await this.setStatus('Starting...');
        process.nextTick(async () => {
          await callable();
          await this.resetStatus();
        });
      } catch (err) {
        console.error(err);
        await this.setStatus(`ERROR: ${err}`);
      }
    }
  }
}
