import { WhoisLightFormattedResult, WhoisLightRawResult } from "whois-light";
import { domainsExist } from "./RecordsModel";
import { DomainName } from "./State";

export interface WhoisWrapped {
  registeredDate: number;
  expiryDate: number;
  updatedDate: number;
  registrar: string | null;
  registrarUrl: string | null;
  registrarId: string | null;
  DNSSEC: string | null;
  domain: DomainName;
  parsedRecord: WhoisLightFormattedResult;
  rawRecord: WhoisLightRawResult;

  meta: {
    /**
     * Whether this is lodged already in our systems.
     */
    isLodged?: boolean;
  };
}

export const buildUnixTime = (timestamp: string) => {
  const date = new Date(timestamp);

  return Math.floor(date.getTime() / 1000);
};


export const readParsedDate = (
  attribute: string,
  parsedRecord: WhoisLightFormattedResult
) => {
  return buildUnixTime(parsedRecord[attribute] ?? "") || 0;
};

export const transformRecord = (
  domain: DomainName,
  parsedRecord: WhoisLightFormattedResult
): WhoisWrapped => {
  return {
    expiryDate: readParsedDate("Registry Expiry Date", parsedRecord),
    registeredDate: readParsedDate("Creation Date", parsedRecord),
    updatedDate: readParsedDate("Updated Date", parsedRecord),
    registrar: parsedRecord['Registrar'] ?? null,
    registrarUrl: parsedRecord['Registrar URL'] ?? null,
    registrarId: parsedRecord['Registrar IANA ID'] ?? null,
    DNSSEC: parsedRecord['DNSSEC'] ?? null,
    domain,
    parsedRecord,
    rawRecord: parsedRecord._raw,

    meta: {},
  };
};

export const transformRecords = async (
  records: Array<{
    domain: DomainName,
    parsedRecord: WhoisLightFormattedResult;
  }>
): Promise<Array<WhoisWrapped>> => {
  const domains = records.map((record) => record.domain.name);

  const domainsExistResult = await domainsExist(domains);

  if(domains.length !== domainsExistResult.length) {
    throw new Error('Length mismatch of domains input and result output');
  }

  return records.map((record, recordIndex): WhoisWrapped => {
    if (record.domain.name !== domains[recordIndex]) {
      throw new Error("Unexpected order returned.");
    }

    if(domainsExistResult[recordIndex] === undefined) {
      throw new Error('Domain exist info not found');
    }

    return {
      ...transformRecord(record.domain, record.parsedRecord),
      meta: {
        isLodged: domainsExistResult[recordIndex],
      },
    };
  });
};
