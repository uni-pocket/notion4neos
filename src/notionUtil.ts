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

type NotionPropSelect = {
  type: "select";
  select: string;
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

type NotionProp =
  | NotionPropRichText
  | NotionPropTitle
  | NotionPropNumber
  | NotionPropCheckbox
  | NotionPropSelect
  | NotionPropRelation
  | NotionPropFiles;

export function getValueFromProp(
  prop: NotionProp
): string | number | boolean | Relation | undefined | any {
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
      return prop.select;
    case "relation":
      return prop.relation;
    case "files":
      return prop.files;
    default:
      return prop[propType];
  }
}
