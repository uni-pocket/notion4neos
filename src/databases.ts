import express from "express";
import _ from "lodash";
import { Client } from "@notionhq/client";
import json2emap from "json2emap";
import { getValueFromProp } from "./notionUtil";

const notionClient = new Client({
  auth: process.env.NOTION_TOKEN,
});

export async function apiGetDatabases(
  req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) {
  const {
    keys: keysRaw,
    sorts: sortsRaw = "[]",
    filter: filterRaw = "{}",
    includeId = false,
    useEmap = true,
  } = req.query;
  const { databaseId } = req.params;

  if (typeof keysRaw != "string") {
    throw new Error(`keys is not string. keys=${keysRaw}`);
  }
  const keys = JSON.parse(keysRaw) as string[];

  if (typeof sortsRaw != "string") {
    throw new Error(`sorts is not string. sort=${sortsRaw}`);
  }
  const sorts = JSON.parse(sortsRaw);

  if (typeof filterRaw != "string") {
    throw new Error(`filter is not string. sort=${filterRaw}`);
  }
  const filter = JSON.parse(filterRaw);

  const response = await notionClient.databases.query({
    database_id: databaseId,
    sorts: sorts,
    ...(_.size(filter) > 0 ? { filter } : {}),
  });

  const result = _(response.results)
    .map((page) => {
      const properties = _.get(page, "properties", {});
      return _(keys)
        .map((key) => {
          const prop = _.get(properties, key);
          if (!prop) {
            res
              .status(500)
              .send(
                `${key} does not exist. keys=${keys}. existKeys=${_.keys(
                  properties
                )}`
              );
          }
          const value = getValueFromProp(prop);
          return { key, value };
        })
        .reduce(
          (prev, curr) => ({ ...prev, ...{ [curr.key]: curr.value } }),
          includeId ? { id: page.id } : {}
        );
    })
    .flatMap()
    .value();

  res.send(useEmap ? json2emap(result) : result);
}
