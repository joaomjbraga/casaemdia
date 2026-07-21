type LogArgs = Array<unknown>;

const format = (...args: LogArgs) => {
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
  info: (...args: LogArgs) => console.info.apply(console, args),
  warn: (...args: LogArgs) => console.warn.apply(console, args),
  debug: (...args: LogArgs) => {
    if (process.env.NODE_ENV !== 'production') console.debug.apply(console, args);
  },
  error: (...args: LogArgs) => {
    // Central place to attach Sentry/remote logging later
    try {
      // keep console output for local debugging
      console.error.apply(console, args);
    } catch {}
    // Could send to remote service asynchronously here
    try {
      const payload = format(...args);
      // placeholder: future integration point
      void payload;
    } catch {}
  },
};

export default logger;
