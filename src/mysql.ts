import mysql from 'mysql2/promise';
import { ConfigurationOptions, getConfigOption } from './Config';

const connection = mysql.createPool({
  host: getConfigOption(ConfigurationOptions.DBHostname),
  database: getConfigOption(ConfigurationOptions.DBDatabase),
  user: getConfigOption(ConfigurationOptions.DBUsername),
  password: getConfigOption(ConfigurationOptions.DBPassword),
});

export default connection;
