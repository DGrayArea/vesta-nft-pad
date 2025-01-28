// import { stringify } from "thirdweb/utils";

const serializeBigIntObj = (obj: unknown): unknown => {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeBigIntObj);
  }

  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      typeof value === "bigint" ? value.toString() : serializeBigIntObj(value),
    ])
  );
};

const serializeBigInt = (obj: unknown) => {
  return JSON.stringify(
    obj,
    (_, value) => (typeof value === "bigint" ? value.toString() : value),
    2
  );
};

export { serializeBigInt, serializeBigIntObj };
