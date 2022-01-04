import dotenv from "dotenv";
import WhoisLight, { WhoisLightFormattedResult } from "whois-light";
import { Analytics } from "./Analytics";
import { ConfigurationOptions, getConfigOptionNumber } from "./Config";
dotenv.config();

import { bulkInsertDomain } from "./RecordsModel";
import { DomainName, State } from "./State";
import { transformRecords } from "./WhoisWrapper";

const workerAttempt = async (
  domains: Record<string, DomainName>,
  analytics: Analytics
) => {
  const domainNames = Object.keys(domains);

  const whoisBulkResult = await WhoisLight.bulkLookup(
    {
      timeout: 5000,
      parellel: 1000,
      format: true,
    },
    domainNames
  );

  const transformRecordsPayload = Object.keys(whoisBulkResult).map((name) => ({
    domain: domains[name],
    parsedRecord: whoisBulkResult[name] as WhoisLightFormattedResult,
  }));

  const transformedWhoisResult = await transformRecords(
    transformRecordsPayload
  );

  // Lodging analytics
  analytics.recordBulk(transformedWhoisResult);

  const filteredExistingRecords = transformedWhoisResult.filter(
    (record) => !record.meta.isLodged
  );

  await bulkInsertDomain(filteredExistingRecords);
};

const main = async (): Promise<void> => {
  console.log("whois-scrape started");

  const workersCount = getConfigOptionNumber(ConfigurationOptions.WorkersCount);
  const workersParallelCount = getConfigOptionNumber(ConfigurationOptions.WorkersParallelCount);
  const workersReattemptCount = getConfigOptionNumber(ConfigurationOptions.WorkersReattemptCount);

  const analytics = new Analytics();
  const state = new State();

  await state.load();

  setInterval(() => analytics.print(), 1000);
  setInterval(() => state.save(), 1000);

  const worker = async () => {
    while (true) {
      const domainsPayload: Record<string, DomainName> = {};

      for (let i = 0; i < workersParallelCount; i++) {
        const domain = state.getDomainName();

        domainsPayload[domain.name] = domain;
      }

      for (let i = 0; i < workersReattemptCount; i++) {
        try {
          await workerAttempt(domainsPayload, analytics);

          break;
        } catch (error) {
          console.error(error);
        }
      }
    }
  };

  for (let i = 0; i < workersCount; i++) {
    setImmediate(worker);
  }
};

main();
