import express from "express";
import _ from "lodash";
import { Client } from "@notionhq/client";
import json2emap from "json2emap";
import { getValueFromProp } from "./notionUtil";

const notionClient = new Client({
  auth: process.env.NOTION_TOKEN,
});

type NeosType = "String" | "Boolean" | "Int" | "Uri" | "Color" | "Unknown";

type ConversionOption = {
  notionName: string;
  dvName?: string;
  dvType?: NeosType;
  listFunc?: "Raw" | "Emap" | "PickFirst" | "PickRandom" | "Join";
  target?: "All" | "Content" | "Id";
  fallback?: string;
};

type ConversionOption4Neos = {
  name: string;
  type: NeosType;
  isList: boolean;
};

function getConversionOption4Neos(
  conversionOption: ConversionOption
): ConversionOption4Neos {
  return {
    name: conversionOption.dvName ?? conversionOption.notionName,
    type: conversionOption.dvType ?? "Unknown",
    isList: conversionOption.listFunc === "Raw",
  };
}

function parseRecord(
  record: any,
  conversionOptions: ConversionOption[]
): { [key: string]: any } {
  const result = _(conversionOptions)
    .map((option) => {
      const prop = _.get(record, option.notionName);
      if (!prop) {
        throw new Error(
          `${option.notionName} does not exist. existKeys=${_.keys(record)}`
        );
      }
      const rawValue = getValueFromProp(prop, option.target);
      const value = ((listFunc) => {
        if (!Array.isArray(rawValue)) {
          return rawValue !== null && rawValue !== undefined && rawValue !== ""
            ? rawValue
            : option.fallback;
        }
        switch (listFunc) {
          case "Raw":
            return rawValue ?? option.fallback;
          case "Emap":
            return json2emap(rawValue) ?? option.fallback;
          case "PickFirst":
            return _.first(rawValue) ?? option.fallback;
          case "PickRandom":
            return (
              _.get(rawValue, _.random(0, _.size(rawValue) - 1, false)) ??
              option.fallback
            );
          case "Join":
            return _.join(rawValue) ?? option.fallback;
        }
      })(option.listFunc);
      return {
        key: option.dvName ?? option.notionName,
        value,
      };
    })
    .reduce(
      (prev, curr) => ({
        ...prev,
        ...(curr.key ? { [curr.key]: curr.value } : {}),
      }),
      {}
    );
  return result;
}

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
  let keys: any[] = [];
  try {
    keys = JSON.parse(keysRaw);
  } catch (error) {
    throw new Error(`keys parse error. keys=${keysRaw}`);
  }
  let simpleKey: boolean = false;
  const conversionOptions = _.map(keys, (key) => {
    if (typeof key === "string") {
      simpleKey = true;
      return {
        notionName: key,
      };
    }
    const { notionName, dvName, dvType, listFunc, target, fallback } = key;
    if (typeof notionName != "string") {
      throw new Error(`keys have not notionName. keys=${keys}`);
    }
    return { notionName, dvName, dvType, listFunc, target, fallback };
  });

  if (typeof sortsRaw != "string") {
    throw new Error(`sorts is not string. sort=${sortsRaw}`);
  }
  const sorts = JSON.parse(sortsRaw);

  if (typeof filterRaw != "string") {
    throw new Error(`filter is not string. sort=${filterRaw}`);
  }
  const filter = JSON.parse(filterRaw);

  if (typeof includeId != "boolean") {
    throw new Error(`includeId is not boolean. includeId=${filterRaw}`);
  }

  let response;
  try {
    response = await notionClient.databases.query({
      database_id: databaseId,
      sorts: sorts,
      ...(_.size(filter) > 0 ? { filter } : {}),
    });
  } catch (err) {
    res.status(500).send(err);
  }

  let data: any[] = [];
  try {
    if (response) {
      data = _(response.results)
        .map((page) => {
          const properties = _.get(page, "properties", {});
          const name = _.get(properties, ["名前", "title", 0, "plain_text"]);
          return {
            ...(includeId ? { id: page.id } : {}),
            ...parseRecord(properties, conversionOptions),
          };
        })
        .flatMap()
        .value();
    }
  } catch (err) {
    res.status(400).send(err);
  }

  const option = _.map(conversionOptions, (opt) =>
    getConversionOption4Neos(opt)
  );

  const result = simpleKey
    ? data
    : {
        option,
        data,
      };

  res.send(useEmap ? json2emap(result) : result);
}

export async function apiGetConversionOptionList(
  req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) {
  const { useEmap = true } = req.query;
  const { databaseId } = req.params;
  let response;
  try {
    response = await notionClient.databases.query({
      database_id: databaseId,
    });
  } catch (err) {
    res.status(500).send(err);
  }

  const requireKeys = [
    "name",
    "notionName",
    "dvName",
    "dvType",
    "listFunc",
    "target",
    "fallback",
    "type",
    "category",
    "data",
  ];

  const results = _(response?.results)
    .map((page) => {
      const properties = _.get(page, "properties", {});
      return _(requireKeys)
        .map((key) => {
          const prop = _.get(properties, key);
          if (!prop) {
            throw new Error(
              `${key} is not found. requireKeys = ${requireKeys}`
            );
          }
          return { key, value: getValueFromProp(prop, "Content") };
        })
        .reduce(
          (prev, curr) => ({
            ...prev,
            ...{ [curr.key]: curr.value },
          }),
          {}
        ) as {
        type: string;
        category: string;
        data: string;
        name: string;
        notionName: string;
        dvName: string;
        dvType: string;
        listFunc: string;
        target: string;
        fallback: string;
      };
    })
    .groupBy(({ category }) => category)
    .map((records, code) => {
      const recordMap = _(records)
        .filter(({ type }) => type === "Record")
        .map(({ name, data }) => ({ key: name, value: data }))
        .reduce(
          (prev, curr) => ({ ...prev, ...{ [curr.key]: curr.value } }),
          {}
        );
      return {
        code,
        recordKeys: _.keys(recordMap),
        records: recordMap,
        conversionOptions: JSON.stringify(
          _(records)
            .filter(({ type }) => type === "Column")
            .map(
              ({ notionName, dvName, dvType, listFunc, target, fallback }) => ({
                notionName,
                dvName,
                dvType,
                listFunc,
                target,
                fallback,
              })
            )
            .value()
        ),
      };
    })
    .value();

  res.send(useEmap ? json2emap(results) : results);
}
