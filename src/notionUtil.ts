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

type Relation = { id: string };
type NotionPropRelation = {
  type: "relation";
  relation: Relation;
};

type NotionProp =
  | NotionPropRichText
  | NotionPropTitle
  | NotionPropNumber
  | NotionPropCheckbox
  | NotionPropRelation;

export function getValueFromProp(
  prop: NotionProp
): string | number | boolean | Relation | undefined {
  switch (prop.type) {
    case "rich_text":
      return prop.rich_text.map((data) => data.plain_text).join("");
    case "title":
      return prop.title.map((data) => data.plain_text).join("");
    case "number":
      return prop.number;
    case "checkbox":
      return prop.checkbox;
    case "relation":
      return prop.relation;
  }
}
