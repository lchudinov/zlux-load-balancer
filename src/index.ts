import { Balancer } from "./balancer";
import { BalancerConfig } from "./balancer-config";
import fs from "fs";

const config = JSON.parse(fs.readFileSync('config.json', 'utf-8')) as BalancerConfig;
const balancer = new Balancer(config);
balancer.start();