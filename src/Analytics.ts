import { WhoisWrapped } from "./WhoisWrapper";

const unixTime = () => Math.floor(Date.now() / 1000);

export class Analytics {
  private count: number;

  private domainsUnregistered: number;

  private domainsExpired: number;

  private alreadyLodged: number;

  private unixStartTime: number;

  constructor() {
    this.count = 0;
    this.domainsUnregistered = 0;
    this.domainsExpired = 0;
    this.alreadyLodged = 0;

    this.unixStartTime = unixTime();
  }

  record(whoisRecord: WhoisWrapped) {
    this.count++;

    if (whoisRecord.rawRecord.substring(0, 19) === "No match for domain") {
      this.domainsUnregistered++;
    }

    if (whoisRecord.expiryDate < unixTime()) {
      this.domainsExpired++;
    }

    if (whoisRecord.meta.isLodged) {
      this.alreadyLodged++;
    }
  }

  recordBulk(whoisRecords: Array<WhoisWrapped>) {
    for (const record of whoisRecords) {
      setImmediate(() => this.record(record));
    }
  }

  print() {
    const elapsedTime = unixTime() - this.unixStartTime;
    const averagePerSecond = Math.floor(this.count / elapsedTime);

    console.log(
      `${this.count}: [${this.domainsExpired} EXPIRED] [${this.domainsUnregistered} UNREGISTERED] [${this.alreadyLodged} ALREADY LODGED] [${averagePerSecond}/s] [${elapsedTime} ELAPSED]`
    );
  }
}
