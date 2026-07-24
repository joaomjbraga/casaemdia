type LogArgs = Array<unknown>;

const format = (...args: LogArgs): string => {
  try {
    return args
      .map((a) => {
        if (a instanceof Error) return a.stack || a.message;
        try {
          return typeof a === 'string' ? a : JSON.stringify(a);
        } catch {
          return String(a);
        }
      })
      .join(' ');
  } catch {
    return args.map(String).join(' ');
  }
};

export const logger = {
  info: (...args: LogArgs) => console.info(format(...args)),
  warn: (...args: LogArgs) => console.warn(format(...args)),
  debug: (...args: LogArgs) => {
    if (process.env.NODE_ENV !== 'production') console.debug(format(...args));
  },
  error: (...args: LogArgs) => {
    console.error(format(...args));
  },
};

export default logger;
