// Credit to: https://github.com/mikemaccana/dynamic-template

export function makeTemplate(
  templateString: string,
  templateVariables: {[key: string]: string},
) {
  const keys = Object.keys(templateVariables);
  const values = Object.values(templateVariables);
  const templateFunction = new Function(
    ...keys,
    `return \`${templateString}\`;`,
  );
  return templateFunction(...values);
}
