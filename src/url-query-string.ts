/**
 * Converts an object to a query string.
 * - Numbers, strings, and booleans are added directly.
 * - Objects and arrays are JSON-stringified.
 * - All values are URL-encoded as necessary.
 *
 * @param obj - The object to convert.
 * @returns A query string starting with '?'.
 */
function objectToQueryString(obj: Record<string, any>): string {
  const params = new URLSearchParams();

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      let paramValue: string;

      if (
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        typeof value === 'string'
      ) {
        paramValue = String(value);
      } else if (typeof value === 'object') {
        paramValue = JSON.stringify(value);
      } else {
        // Skip undefined or function types
        continue;
      }

      params.append(key, paramValue);
    }
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Parses a query string back into an object.
 * - Tries to parse values as JSON.
 * - If parsing fails, attempts to interpret as number or boolean.
 * - Defaults to string if other parsing fails.
 *
 * @param queryString - The query string to parse.
 * @returns An object representing the query parameters.
 */
function queryStringToObject(queryString: string): Record<string, any> {
  const obj: Record<string, any> = {};

  // Remove the leading '?' if present
  const query = queryString.startsWith('?') ? queryString.slice(1) : queryString;
  const params = new URLSearchParams(query);

  params.forEach((value, key) => {
    let parsedValue: any;

    // Try to parse as JSON
    try {
      parsedValue = JSON.parse(value);
      obj[key] = parsedValue;
      return;
    } catch {
      // Not JSON
    }

    // Try to parse as number
    if (!isNaN(Number(value))) {
      obj[key] = Number(value);
      return;
    }

    // Check for boolean values
    if (value.toLowerCase() === 'true') {
      obj[key] = true;
      return;
    }
    if (value.toLowerCase() === 'false') {
      obj[key] = false;
      return;
    }

    // Default to string
    obj[key] = value;
  });

  return obj;
}

export { objectToQueryString, queryStringToObject };
