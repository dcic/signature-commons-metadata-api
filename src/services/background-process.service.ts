import {bind, /* inject, */ BindingScope} from '@loopback/core';

@bind({scope: BindingScope.SINGLETON})
export class BackgroundProcessService {
  constructor() {
    this.status = undefined;
  }
  status?: string;

  spawn(callable: () => Promise<void>): void {
    setTimeout(() => {
      callable().catch(err => {
        console.error(err);
        this.status = `ERROR: ${err}`;
      });
    }, 0);
  }
}
