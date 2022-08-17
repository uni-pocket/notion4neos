import _ from "lodash";

type NotionPropRichText = {
  type: "rich_text";
  rich_text: { plain_text: string }[];
};

type NotionPropTitle = {
  type: "title";
  title: { plain_text: string }[];
};

type NotionPropNumber = {
  type: "number";
  number?: number;
};

type NotionPropCheckbox = {
  type: "checkbox";
  checkbox: boolean;
};

type Select = {
  id: string;
  name: string;
  color: string;
};
type NotionPropSelect = {
  type: "select";
  select: Select | undefined;
};

type NotionMultiSelect = {
  type: "multi_select";
  multi_select: Select[];
};

type Relation = { id: string };
type NotionPropRelation = {
  type: "relation";
  relation: Relation;
};

type File = {
  name: string;
  type: "file";
  file: {
    url: string;
    expiry_time: string;
  };
};
type NotionPropFiles = {
  type: "files";
  files: File[];
};

type NotionPropFormula = {
  type: "formula";
  formula: { type: string } | any;
};

type NotionProp =
  | NotionPropRichText
  | NotionPropTitle
  | NotionPropNumber
  | NotionPropCheckbox
  | NotionPropSelect
  | NotionMultiSelect
  | NotionPropRelation
  | NotionPropFiles
  | NotionPropFormula;

export function getValueFromProp(
  prop: NotionProp,
  optionType: "All" | "Content" | "Id" | undefined
): any {
  const propType = prop.type;
  switch (propType) {
    case "rich_text":
      return prop.rich_text.map((data) => data.plain_text).join("");
    case "title":
      return prop.title.map((data) => data.plain_text).join("");
    case "number":
      return prop.number;
    case "checkbox":
      return prop.checkbox;
    case "select":
      switch (optionType ?? "Content") {
        case "All":
          return prop.select;
        case "Id":
          return prop.select?.id;
        case "Content":
          return prop.select?.name;
      }
    case "multi_select":
      switch (optionType ?? "Content") {
        case "All":
          return prop.multi_select;
        case "Id":
          return prop.multi_select.map(({ id }) => id);
        case "Content":
          return prop.multi_select.map(({ name }) => name);
      }
    case "relation":
      return prop.relation;
    case "files":
      switch (optionType ?? "Content") {
        case "All":
          return prop.files;
        case "Content":
          return _.map(prop.files, ({ file }) => file.url);
        case "Id":
          return _.map(prop.files, ({ name }) => name);
      }
    case "formula":
      return prop.formula[prop.formula.type];
    default:
      return prop[propType];
  }
}
