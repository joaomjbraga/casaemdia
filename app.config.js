const fs = require('fs');
const path = require('path');

function loadDotEnv(envPath) {
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const raw = fs.readFileSync(envPath, 'utf8');
  const envVars = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (value.startsWith("\"") && value.endsWith("\"")) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }

    if (key) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
      if (key.startsWith('EXPO_PUBLIC_')) {
        envVars[key] = value;
      }
    }
  }

  return envVars;
}

const envPath = path.resolve(__dirname, '.env');
const builtEnv = loadDotEnv(envPath);

const config = require('./app.json');
config.expo = config.expo || {};
config.expo.extra = {
  ...(config.expo.extra || {}),
  ...builtEnv,
};

config.expo.plugins = config.expo.plugins || [];
if (!config.expo.plugins.includes('expo-sqlite')) {
  config.expo.plugins.push('expo-sqlite');
}

module.exports = config;
