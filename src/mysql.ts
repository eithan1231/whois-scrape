import mysql from 'mysql2/promise';
import { ConfigurationOptions, getConfigOption } from './Config';

const connection = mysql.createPool({
  host: getConfigOption(ConfigurationOptions.DBHostname),
  database: getConfigOption(ConfigurationOptions.DBDatabase),
  user: getConfigOption(ConfigurationOptions.DBUsername),
  password: getConfigOption(ConfigurationOptions.DBPassword),
});

export const connectionHostname = getConfigOption(ConfigurationOptions.DBHostname);
export const connectionDatabase = getConfigOption(ConfigurationOptions.DBDatabase);
export const connectionUsername = getConfigOption(ConfigurationOptions.DBUsername);
export const connectionPassword = getConfigOption(ConfigurationOptions.DBPassword);
export const connectionTableRecords = `records`;

export default connection;
