import ts from "typescript";

export function generateLiteral(
  factory: ts.NodeFactory,
  value: null,
): ts.NullLiteral;
export function generateLiteral(
  factory: ts.NodeFactory,
  value: true,
): ts.TrueLiteral;
export function generateLiteral(
  factory: ts.NodeFactory,
  value: false,
): ts.FalseLiteral;
export function generateLiteral(
  factory: ts.NodeFactory,
  value: string,
): ts.StringLiteral;
export function generateLiteral(
  factory: ts.NodeFactory,
  value: number,
): ts.NumericLiteral;
export function generateLiteral(
  factory: ts.NodeFactory,
  value: object,
): ts.ObjectLiteralExpression;
export function generateLiteral(
  factory: ts.NodeFactory,
  value: Array<unknown>,
): ts.ArrayLiteralExpression;
export function generateLiteral(
  factory: ts.NodeFactory,
  value: unknown,
):
  | ts.NullLiteral
  | ts.BooleanLiteral
  | ts.LiteralExpression
  | ts.ObjectLiteralExpression
  | ts.ArrayLiteralExpression;
export function generateLiteral(
  factory: ts.NodeFactory,
  value: unknown,
): ts.Expression {
  if (value != null && typeof value === "object") {
    if (Array.isArray(value))
      return factory.createArrayLiteralExpression(
        value.map((value) => generateLiteral(factory, value)),
        true,
      );

    return factory.createObjectLiteralExpression(
      Object.entries(value).map(([key, value]) =>
        factory.createPropertyAssignment(
          factory.createStringLiteral(key),
          generateLiteral(factory, value),
        ),
      ),
      true,
    );
  }

  return generatePrimitiveLiteral(factory, value);
}

export function generatePrimitiveLiteral(
  factory: ts.NodeFactory,
  value: null,
): ts.NullLiteral;
export function generatePrimitiveLiteral(
  factory: ts.NodeFactory,
  value: true,
): ts.TrueLiteral;
export function generatePrimitiveLiteral(
  factory: ts.NodeFactory,
  value: false,
): ts.FalseLiteral;
export function generatePrimitiveLiteral(
  factory: ts.NodeFactory,
  value: string,
): ts.StringLiteral;
export function generatePrimitiveLiteral(
  factory: ts.NodeFactory,
  value: number,
): ts.NumericLiteral;
export function generatePrimitiveLiteral(
  factory: ts.NodeFactory,
  value: unknown,
): ts.NullLiteral | ts.BooleanLiteral | ts.LiteralExpression;
export function generatePrimitiveLiteral(
  factory: ts.NodeFactory,
  value: unknown,
): ts.Expression {
  if (value === null) return factory.createNull();

  switch (typeof value) {
    case "string":
      return factory.createStringLiteral(value);

    case "number":
      return factory.createNumericLiteral(value);

    case "boolean":
      return value ? factory.createTrue() : factory.createFalse();

    default:
      throw new Error("type not supported");
  }
}
