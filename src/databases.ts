import express from "express";
import _ from "lodash";
import { Client } from "@notionhq/client";
import json2emap from "json2emap";

const notionClient = new Client({
  auth: process.env.NOTION_TOKEN,
});

export async function apiGetDatabases(
  req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) {
  const { keys, useEmap = true } = req.query;
  const { databaseId } = req.params;

  if (typeof keys != "string") {
    throw new Error(`keys is not string. keys=${keys}`);
  }

  const requestKeys = JSON.parse(keys) as string[];

  const response = await notionClient.databases.query({
    database_id: databaseId,
  });

  const result = _(response.results)
    .map((page) => {
      const properties = _.get(page, "properties", {});
      return _(requestKeys)
        .map((key) => {
          const prop = _.get(properties, key);
          if (!prop) {
            res
              .status(500)
              .send(
                `${key} does not exist. requestKeys=${requestKeys}. existKeys=${_.keys(
                  properties
                )}`
              );
          }
          const value = _.get(prop, [prop.type, 0, "plain_text"], "");
          return { key, value };
        })
        .reduce(
          (prev, curr) => ({ ...prev, ...{ [curr.key]: curr.value } }),
          {}
        );
    })
    .flatMap()
    .value();

  res.send(useEmap ? json2emap(result) : result);
}
