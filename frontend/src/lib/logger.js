export const logger = {
  debug: (msg, ctx) => console.log(msg, ctx),
  info: (msg, ctx) => console.log(msg, ctx),
  warn: (msg, ctx) => console.warn(msg, ctx),
  error: (msg, ctx) => console.error(msg, ctx),
  exception: (msg, err, ctx) => console.error(msg, err, ctx),
}
