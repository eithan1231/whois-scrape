import mysqlPool, { connectionTableRecords } from "./mysql";
import { WhoisWrapped } from "./WhoisWrapper";

type QueryShowTableResult = Array<{ Tables_in_domains: string }>;

export const initialiseDatabase = async (): Promise<void> => {
  console.log("DB Initialisation: Starting");

  const [rows, fields] = await mysqlPool.execute(`SHOW TABLES`);

  const hasTable = (rows as QueryShowTableResult).find(
    (row) => row.Tables_in_domains === connectionTableRecords
  );

  if (hasTable) {
    console.log("DB Initialisation: Skipping");
    return;
  }

  console.log("DB Initialisation: Creating records table");

  await mysqlPool.execute(
    `
      CREATE TABLE ${connectionTableRecords} (
        id bigint NOT NULL,
        registered_date bigint NOT NULL,
        expiry_date bigint NOT NULL,
        updated_date bigint NOT NULL,
        name varchar(512) NOT NULL,
        tld varchar(32) NOT NULL,
        registrar varchar(512) NOT NULL,
        registrar_url varchar(512) NOT NULL,
        registrar_id varchar(16) NOT NULL,
        dnssec text NOT NULL,
        data_parsed longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
        data text NOT NULL
      )
    `
  );

  console.log("DB Initialisation: Adding indexes");

  await mysqlPool.execute(
    `
      ALTER TABLE ${connectionTableRecords}
        ADD PRIMARY KEY (id),
        ADD KEY name (name)
    `
  );

  console.log("DB Initialisation: Adding auto increment to primary key");

  await mysqlPool.execute(
    `
      ALTER TABLE ${connectionTableRecords}
        MODIFY id bigint NOT NULL AUTO_INCREMENT
    `
  );

  console.log("DB Initialisation: Done");
};

export const domainExists = async (name: string): Promise<boolean> => {
  const [rows, fields] = await mysqlPool.execute(
    `
      SELECT count(1) as count
      FROM ${connectionTableRecords}
      WHERE name = ?
    `,
    [name]
  );

  return rows[0].count > 0;
};

export const domainsExist = async (
  names: string[]
): Promise<Array<boolean>> => {
  const [rows, fields] = await mysqlPool.query(
    `
      SELECT
      count(1) as count, name
      FROM ${connectionTableRecords}
      WHERE name IN (?)
      GROUP BY name
    `,
    [names]
  );

  return names.map((name) => {
    const foundRow = (rows as Array<{ count: number; name: string }>).find(
      (row) => row.name === name
    );

    if (foundRow) {
      return foundRow.count > 0;
    }

    return false;
  });
};

export const bulkInsertDomain = async (
  records: Array<WhoisWrapped>
): Promise<void> => {
  if (records.length === 0) {
    return;
  }

  const mysqlPrepapredPayload = records.map((record) => [
    null,
    record.registeredDate,
    record.expiryDate,
    record.updatedDate,
    record.domain.name,
    record.domain.tld,
    record.registrar ?? "",
    record.registrarUrl ?? "",
    record.registrarId ?? "",
    record.DNSSEC ?? "",
    JSON.stringify(record.parsedRecord) || "{}",
    record.rawRecord,
  ]);

  await mysqlPool.query(
    `
      INSERT INTO ${connectionTableRecords}
      (
        id,
        registered_date,
        expiry_date,
        updated_date,
        name,
        tld,
        registrar,
        registrar_url,
        registrar_id,
        dnssec,
        data_parsed,
        data
      )
      VALUES ?
    `,
    [mysqlPrepapredPayload]
  );
};
