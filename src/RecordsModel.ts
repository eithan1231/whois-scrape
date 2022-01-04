import mysqlPool from "./mysql";
import { WhoisWrapped } from "./WhoisWrapper";

export const domainExists = async (name: string): Promise<boolean> => {
  const [rows, fields] = await mysqlPool.execute(
    `
      SELECT count(1) as count
      FROM records
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
      FROM records
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
    record.registrar ?? '',
    record.registrarUrl ?? '',
    record.registrarId ?? '',
    record.DNSSEC ?? '',
    JSON.stringify(record.parsedRecord) || "{}",
    record.rawRecord,
  ]);

  await mysqlPool.query(
    `
      INSERT INTO records
      (
        id,
        registered_date,
        expiry_date,
        updated_date,
        name,
        tld,
        registrar,
        registrarUrl,
        registrarId,
        DNSSEC,
        data_parsed,
        data
      )
      VALUES ?
    `,
    [mysqlPrepapredPayload]
  );
};
