import handler from './src/main.js';

export default async ({ req, res, log, error }) => {
  return handler({ req, res, log, error });
};
