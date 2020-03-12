import {TrieRouter, Request} from '@loopback/rest';

export class SmartTrieRouter extends TrieRouter {
  // Trim the trailing slash if there
  protected getKeyForRequest(request: Request) {
    const key = super.getKeyForRequest(request);
    const resolved_key = /^(.*?)\/*$/.exec(key);
    if (resolved_key === null) return key;
    return resolved_key[1];
  }
}
