import fsPromises from "fs/promises";
import { ConfigurationOptions, getConfigOption } from "./Config";
import whoisLightServers from "whois-light/servers.json";
import path from 'path';

export interface DomainName {
  name: string;
  tld: string;
}

const defaultStateValue = [-1];
const domainCharacters = "abcdefghijklmnopqrstuvwxyz";

export class State {
  currentTldIndex: number = 0;
  tlds: string[] = [];
  state: Record<string, number[]> = {};
  stateOriginal: Record<string, number[]>;

  constructor() {
    const tldsConfig = getConfigOption(ConfigurationOptions.TopLevelDomains);

    const processedTlds = tldsConfig.split(",").map((value) => value.trim());

    for (const tld of processedTlds) {
      if (whoisLightServers[tld] === undefined) {
        throw new Error(`Invalid top level domain ${tld}`);
      }
    }

    this.tlds = processedTlds;
  }

  private getNextTld(): string {
    if (this.tlds.length === 1) {
      return this.tlds[0];
    }

    if (this.tlds[this.currentTldIndex] === undefined) {
      this.currentTldIndex = 0;
    }

    return this.tlds[this.currentTldIndex++];
  }

  getDomainName(): DomainName {
    const tld = this.getNextTld();

    if (this.state[tld] === undefined) {
      this.state[tld] = defaultStateValue;
    }

    for (let i = 0; i < this.state[tld].length; i++) {
      const domainIndex = this.state[tld].length - i - 1;

      if (this.state[tld][domainIndex] >= domainCharacters.length - 1) {
        this.state[tld][domainIndex] = 0;

        if (this.state[tld][domainIndex - 1] === undefined) {
          this.state[tld].splice(0, 0, -1);
        }
      } else {
        this.state[tld][domainIndex]++;
        break;
      }
    }

    const name =
      this.state[tld]
        .map((domainValue) => domainCharacters[domainValue])
        .join("") + `.${tld}`;

    return {
      name,
      tld,
    };
  }

  async load(): Promise<void> {
    const stateContent = await fsPromises.readFile(this.getStatePath(), {
      encoding: "utf-8",
    });

    const stateParsed = JSON.parse(stateContent) as Record<string, number[]>;

    this.state = stateParsed;
    this.stateOriginal = stateParsed;
  }

  async save(): Promise<void> {
    const stateContent = JSON.stringify(this.state);

    await fsPromises.writeFile(this.getStatePath(), stateContent);
  }

  getStatePath(): string {
    return path.join(process.cwd(), '/data/state.json');
  }
}
