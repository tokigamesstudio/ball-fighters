// node_modules/stake-engine/package.json
var package_default = {
  name: "stake-engine",
  version: "0.1.32",
  main: "dist/index.js",
  module: "dist/index.mjs",
  types: "dist/index.d.ts",
  type: "module",
  scripts: {
    build: "tsc",
    lint: "eslint . --ext .ts,.tsx,.js,.jsx",
    "lint:fix": "eslint . --ext .ts,.tsx,.js,.jsx --fix",
    format: 'prettier --write "**/*.{ts,tsx,js,jsx,json,md}"'
  },
  devDependencies: {
    "@types/chai": "^5.2.2",
    "@types/mocha": "^10.0.10",
    "@types/node": "^24.3.1",
    "@typescript-eslint/eslint-plugin": "^8.41.0",
    "@typescript-eslint/parser": "^8.41.0",
    chai: "^6.0.1",
    eslint: "^9.34.0",
    "eslint-config-prettier": "^10.1.8",
    "eslint-plugin-prettier": "^5.5.4",
    mocha: "^11.7.2",
    prettier: "^3.6.2",
    typescript: "^5.9.2",
    "typescript-eslint": "^8.41.0"
  },
  description: "Typescript client to communicate with the Stake Engine API.",
  keywords: [],
  author: "",
  license: "ISC",
  exports: {
    ".": {
      import: "./dist/index.js",
      types: "./dist/index.d.ts"
    }
  }
};

// node_modules/stake-engine/dist/helpers.js
var parseBalance = (balance) => {
  return {
    amount: balance.amount,
    currency: balance.currency
  };
};
var ParseAmount = (val) => {
  return val / API_MULTIPLIER;
};
var DisplayAmount = (balance, options) => {
  const meta = CurrencyMeta[balance.currency] ?? {
    symbol: balance.currency,
    decimals: 2,
    symbolAfter: true
  };
  const browserLocale = navigator.language || "en-US";
  const amount = ParseAmount(balance.amount);
  let decimals = options?.decimals ?? meta.decimals;
  if (options?.trimDecimalForIntegers && amount % 1 === 0) {
    decimals = 0;
  }
  const formattedAmount = new Intl.NumberFormat(browserLocale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
  const removeSymbol = options?.removeSymbol ?? false;
  if (meta.symbolAfter) {
    return `${formattedAmount}${!removeSymbol ? " " + meta.symbol : ""}`;
  } else {
    return `${!removeSymbol ? meta.symbol : ""}${formattedAmount}`;
  }
};
var CurrencyMeta = {
  USD: { symbol: "$", decimals: 2 },
  CAD: { symbol: "CA$", decimals: 2 },
  JPY: { symbol: "\xA5", decimals: 0 },
  EUR: { symbol: "\u20AC", decimals: 2 },
  RUB: { symbol: "\u20BD", decimals: 2 },
  CNY: { symbol: "CN\xA5", decimals: 2 },
  PHP: { symbol: "\u20B1", decimals: 2 },
  INR: { symbol: "\u20B9", decimals: 2 },
  IDR: { symbol: "Rp", decimals: 0 },
  KRW: { symbol: "\u20A9", decimals: 0 },
  BRL: { symbol: "R$", decimals: 2 },
  MXN: { symbol: "MX$", decimals: 2 },
  DKK: { symbol: "KR", decimals: 2, symbolAfter: true },
  PLN: { symbol: "z\u0142", decimals: 2, symbolAfter: true },
  VND: { symbol: "\u20AB", decimals: 0, symbolAfter: true },
  TRY: { symbol: "\u20BA", decimals: 2 },
  CLP: { symbol: "CLP", decimals: 0, symbolAfter: true },
  ARS: { symbol: "ARS", decimals: 2, symbolAfter: true },
  PEN: { symbol: "S/", decimals: 2, symbolAfter: true },
  NGN: { symbol: "\u20A6", decimals: 0 },
  SAR: { symbol: "SAR", decimals: 2, symbolAfter: true },
  ILS: { symbol: "ILS", decimals: 2, symbolAfter: true },
  AED: { symbol: "AED", decimals: 2, symbolAfter: true },
  TWD: { symbol: "NT$", decimals: 2 },
  NOK: { symbol: "kr", decimals: 2 },
  KWD: { symbol: "KD", decimals: 2 },
  JOD: { symbol: "JD", decimals: 2 },
  CRC: { symbol: "\u20A1", decimals: 2 },
  TND: { symbol: "TND", decimals: 2, symbolAfter: true },
  SGD: { symbol: "SG$", decimals: 2 },
  MYR: { symbol: "RM", decimals: 2 },
  OMR: { symbol: "OMR", decimals: 2, symbolAfter: true },
  QAR: { symbol: "QAR", decimals: 2, symbolAfter: true },
  BHD: { symbol: "BD", decimals: 2 },
  XGC: { symbol: "GC", decimals: 0, symbolAfter: true },
  XSC: { symbol: "SC", decimals: 2, symbolAfter: true }
};
var API_MULTIPLIER = 1e6;

// node_modules/stake-engine/dist/client.js
var RGSClient = (options) => {
  console.log(`Stake Engine Client Version: ${package_default.version}`, "background: #222; color: #e9bc6fff");
  const client = {};
  const url = new URL(options.url);
  const searchParams = url.searchParams;
  client.lang = searchParams.get("lang") || "en";
  const device = searchParams.get("device") || "desktop";
  if (device !== "desktop" && device !== "mobile") {
    throw new Error(`Unsupported device type: ${device}`);
  }
  client.device = device;
  const sessionID = searchParams.get("sessionID");
  if (!sessionID) {
    throw new Error("sessionID is not in set in url parameters");
  }
  client.sessionID = sessionID;
  const paramRGSURL = searchParams.get("rgs_url");
  if (!paramRGSURL) {
    throw new Error("rgs_url is not in set in url parameters");
  }
  const fullRGSURL = `${options.protocol ?? "https"}://${paramRGSURL}`;
  const enforceBetLevels = options.enforceBetLevels ?? true;
  let roundActive = false;
  client.Authenticate = async () => {
    const response = await fetch(`${fullRGSURL}/wallet/authenticate`, {
      method: "POST",
      body: JSON.stringify({
        sessionID: client.sessionID,
        language: client.lang
      }),
      headers: {
        "Content-Type": "application/json"
      }
    });
    const data = await response.json();
    if (response.status / 100 !== 2) {
      throw new Error(data);
    }
    client.jurisdictionFlags = {
      socialCasino: data.config.jurisdiction.socialCasino,
      disabledFullscreen: data.config.jurisdiction.disabledFullscreen,
      disabledTurbo: data.config.jurisdiction.disabledTurbo,
      disabledSuperTurbo: data.config.jurisdiction.disabledSuperTurbo,
      disabledAutoplay: data.config.jurisdiction.disabledAutoplay,
      disabledSlamstop: data.config.jurisdiction.disabledSlamstop,
      disabledSpacebar: data.config.jurisdiction.disabledSpacebar,
      disabledBuyFeature: data.config.jurisdiction.disabledBuyFeature,
      displayNetPosition: data.config.jurisdiction.displayNetPosition,
      displayRTP: data.config.jurisdiction.displayRTP,
      displaySessionTimer: data.config.jurisdiction.displaySessionTimer,
      minimumRoundDuration: data.config.jurisdiction.minimumRoundDuration
    };
    client.authenticateConfig = {
      minBet: data.config.minBet,
      maxBet: data.config.maxBet,
      stepBet: data.config.stepBet,
      defaultBetLevel: data.config.defaultBetLevel,
      betLevels: data.config.betLevels
    };
    const parsed = parseBalance(data.balance);
    emitBalanceEvent(parsed);
    if (data?.round?.active) {
      emitRoundActiveEvent(true);
      roundActive = true;
    }
    client.balance = parsed;
    return {
      balance: parsed,
      config: client.authenticateConfig,
      jurisdictionFlags: client.jurisdictionFlags,
      round: data.round
    };
  };
  const balanceFn = async () => {
    if (!client.authenticateConfig) {
      throw new Error("Client is not authenticated, please call Authenticate()");
    }
    const response = await fetch(`${fullRGSURL}/wallet/balance`, {
      method: "POST",
      body: JSON.stringify({
        sessionID: client.sessionID
      }),
      headers: {
        "Content-Type": "application/json"
      }
    });
    const data = await response.json();
    if (response.status / 100 !== 2) {
      throw new Error(data);
    }
    const parsed = parseBalance(data.balance);
    emitBalanceEvent(parsed);
    client.balance = parsed;
    return {
      balance: parsed
    };
  };
  let balanceInterval;
  const startBalanceInterval = () => {
    if (balanceInterval) {
      clearInterval(balanceInterval);
    }
    balanceInterval = setInterval(balanceFn, 60 * 1e3);
  };
  client.Play = async (params) => {
    if (!client.authenticateConfig) {
      throw new Error("Client is not authenticated, please call Authenticate()");
    }
    if (roundActive) {
      throw new Error("A round is already active, please call EndRound() before starting a new round");
    }
    if (params.amount % client.authenticateConfig.stepBet !== 0) {
      throw new Error(`Bet amount must be a multiple of ${client.authenticateConfig.stepBet}`);
    }
    if (params.amount < client.authenticateConfig.minBet || params.amount > client.authenticateConfig.maxBet) {
      throw new Error(`Bet amount must between min bet (${client.authenticateConfig.minBet}) and max bet (${client.authenticateConfig.maxBet})`);
    }
    if (enforceBetLevels) {
      if (!client.authenticateConfig.betLevels.includes(params.amount)) {
        throw new Error(`Bet amount must be one of the following levels: ${client.authenticateConfig.betLevels.join(", ")}. You may disable bet level enforcement by setting enforceBetLevels to false when creating the client.`);
      }
    }
    emitRoundActiveEvent(true);
    roundActive = true;
    const response = await fetch(`${fullRGSURL}/wallet/play`, {
      method: "POST",
      body: JSON.stringify({
        sessionID: client.sessionID,
        mode: params.mode,
        amount: params.amount
      }),
      headers: {
        "Content-Type": "application/json"
      }
    });
    const data = await response.json();
    if (response.status / 100 !== 2) {
      emitRoundActiveEvent(false);
      roundActive = false;
      throw new Error(data);
    }
    const parsed = parseBalance(data.balance);
    emitBalanceEvent(parsed);
    if (!data?.round?.active) {
      emitRoundActiveEvent(false);
      roundActive = false;
    }
    startBalanceInterval();
    client.balance = parsed;
    return {
      balance: parsed,
      round: data.round
    };
  };
  client.EndRound = async () => {
    if (!client.authenticateConfig) {
      throw new Error("Client is not authenticated, please call Authenticate()");
    }
    const response = await fetch(`${fullRGSURL}/wallet/end-round`, {
      method: "POST",
      body: JSON.stringify({
        sessionID: client.sessionID
      }),
      headers: {
        "Content-Type": "application/json"
      }
    });
    const data = await response.json();
    if (response.status / 100 !== 2) {
      throw new Error(data);
    }
    const parsed = parseBalance(data.balance);
    emitBalanceEvent(parsed);
    emitRoundActiveEvent(false);
    roundActive = false;
    startBalanceInterval();
    client.balance = parsed;
    return {
      balance: parsed
    };
  };
  client.Event = async (eventValue) => {
    if (!client.authenticateConfig) {
      throw new Error("Client is not authenticated, please call Authenticate()");
    }
    const response = await fetch(`${fullRGSURL}/bet/event`, {
      method: "POST",
      body: JSON.stringify({
        sessionID: client.sessionID,
        event: eventValue
      }),
      headers: {
        "Content-Type": "application/json"
      }
    });
    const data = await response.json();
    if (response.status / 100 !== 2) {
      throw new Error(data);
    }
    return {
      event: data.event
    };
  };
  return client;
};
var emitBalanceEvent = (balance) => {
  window.dispatchEvent(new CustomEvent("balanceUpdate", { detail: balance }));
};
var emitRoundActiveEvent = (active) => {
  window.dispatchEvent(new CustomEvent("roundActive", { detail: { active } }));
};
export {
  DisplayAmount,
  ParseAmount,
  RGSClient,
  parseBalance
};
