import express from 'express';
import request from 'request';
import https from 'https';
import fs from 'fs';
import { BalancerConfig } from './balancer-config';


export class Balancer {
  cur = 0;
  config: BalancerConfig;
  keys: string[] = [];
  certs: string[] = [];
  servers: string[];
  server: https.Server;

  constructor(config: BalancerConfig) {
    this.config = config;
    this.servers = this.config.servers;
    this.readKeysAndCerts();
    const app = express().use(
      (req: express.Request, res: express.Response, next: express.NextFunction) => this.profilerMiddleware(req, res, next)
    ).all('*', (req: express.Request, res: express.Response) => this.handler(req, res));
    this.server = https.createServer({ key: this.keys as any, cert: this.certs }, app);
  }

  start(): void {
    console.log(`config: ${JSON.stringify(this.config, null, 2)}`);
    this.server.listen(this.config.https.port);
  }

  private handler(req: express.Request, res: express.Response) {
    const url = this.servers[this.cur] + req.url;
    console.log(`handler for ${url}`);
    const _req = request({
      url: url,
      strictSSL: false,
      followAllRedirects: true,
    }).on('error', error => {
      console.log(`[${this.servers[this.cur]}] error for req.url: ${req.url}`);
      res.status(500).send(error.message);
    });
    req.pipe(_req).pipe(res);
    this.cur = (this.cur + 1) % this.servers.length;
  };

  private profilerMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
    const start = Date.now();
    res.on('finish', () => {
      console.log('Completed', req.method, req.url, Date.now() - start, 'ms');
    });
    next();
  };

  private readKeysAndCerts(): void {
    for (const file of this.config.https.keys) {
      this.keys.push(fs.readFileSync(file, 'utf-8'));
    }
    for (const file of this.config.https.certs) {
      this.certs.push(fs.readFileSync(file, 'utf-8'));
    }
  }
}

