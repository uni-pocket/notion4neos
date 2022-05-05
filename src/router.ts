import express from "express";
import { apiGetDatabases } from "./databases";

function e(
  path: string,
  fn: (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => Promise<void>
): [string, express.Handler] {
  return [
    path,
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      fn(req, res, next).catch(next);
    },
  ];
}

export default function router(app: express.Express) {
  app.get(...e("/api/v1/databases/:databaseId", apiGetDatabases));
}
