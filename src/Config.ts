export enum ConfigurationOptions {
  DBHostname = "DB_HOSTNAME",
  DBUsername = "DB_USERNAME",
  DBPassword = "DB_PASSWORD",
  DBDatabase = "DB_DATABASE",
  TopLevelDomains = "TOP_LEVEL_DOMAINS",
  WorkersCount = "WORKERS_COUNT",
  WorkersParallelCount = "WORKERS_PARALLEL_COUNT",
  WorkersReattemptCount = "WORKERS_REATTEMPT_COUNT",
};


/**
 * Validated the integiry of the configuration based on the ConfigurationOptions enum.
 */
export const validateConfig = (): boolean => {
  const configOptions = Object.values(ConfigurationOptions);
  
  return configOptions.every((option) => !!process.env[option]);
};

/**
 * Gets a string configuration option from envinmnent variables.
 * @param option Envinmnent varialbe to fetch.
 * @returns envinmnent variable.
 */
export const getConfigOption = (option: ConfigurationOptions): string => {
  if(process.env[option]) {
    return process.env[option];
  }

  throw new Error(`Config Manager: Option "${option}" not found.`);
};

/**
 * Gets a number configuration option from envinmnent variables.
 * @param option Envinmnent varialbe to fetch.
 * @returns envinmnent variable.
 */
export const getConfigOptionNumber = (option: ConfigurationOptions): number => {
  const configOption = Number(getConfigOption(option));

  if(Number.isNaN(configOption)) {
    throw new Error(`Config Manager: Option "${option}" is NaN`);
  }

  return configOption;
};

/**
 * Gets a boolean configuration option from envinmnent variables.
 * @param option Envinmnent varialbe to fetch.
 * @returns envinmnent variable.
 */
export const getConfigOptionBoolean = (option: ConfigurationOptions): boolean => {
  const optionValue = getConfigOption(option);

  const truthValues = ['y', 'yes', 'true', '1'];

  return truthValues.includes(optionValue.toLowerCase());
};
