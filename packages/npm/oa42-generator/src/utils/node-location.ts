export const urlRegExp = /^([a-z]+\:(?:\/\/)?[^\/]*)?([^\?\#]*?)?(\?.*?)?(\#.*?)?$/i;

/**
 * Location of a node. The location can be either a path or a url
 *
 * @see https://www.rfc-editor.org/rfc/rfc6901
 */
export class NodeLocation {
  public readonly path: string[];

  private constructor(
    public readonly origin: string,
    path: string[],
    public readonly query: string,
    public readonly pointer: string[],
    public readonly anchor: string,
  ) {
    let pathIndex = 0;
    // normalize the path
    while (pathIndex < path.length) {
      let pathPart = path[pathIndex];

      // first or last parts may be empty
      if ((pathIndex === 0 || pathIndex === path.length - 1) && pathPart.length === 0) {
        pathIndex++;
        continue;
      }

      // empty parts, or paths that are a dot are removed
      if (pathPart.length === 0 || pathPart === ".") {
        path.splice(pathIndex, 1);
        continue;
      }

      if (pathPart === ".." && pathIndex > 0 && path[pathIndex - 1].length === 0) {
        path.splice(pathIndex, 1);
        continue;
      }

      if (pathPart === ".." && pathIndex > 0 && path[pathIndex - 1] !== "..") {
        pathIndex--;
        path.splice(pathIndex, 2);
        continue;
      }

      pathIndex++;
    }

    this.path = path;
  }

  public static parse(input: string) {
    // replace all "\" with "/"
    input = input.replaceAll("\\", "/");

    // match origin
    const inputMatch = urlRegExp.exec(input);

    if (inputMatch == null) {
      throw new TypeError("could not parse input");
    }

    const [, originMatch, pathMatch, queryMatch, hashMatch] = inputMatch;

    let origin = "";
    if (originMatch != null) {
      origin = originMatch;
    }

    let path = new Array<string>();
    if (pathMatch != null && pathMatch.length > 0) {
      path = pathMatch.split("/").map((part) => decodeURI(part));
    }

    let query = "";
    if (queryMatch != null && queryMatch.startsWith("?")) {
      query = queryMatch;
    }

    let pointer = new Array<string>();
    let anchor = "";
    if (hashMatch != null && hashMatch.startsWith("#")) {
      if (hashMatch.startsWith("#/")) {
        pointer = hashMatch
          .substring(2)
          .split("/")
          .map((part) => decodeURI(part))
          .map((part) => NodeLocation.unescapePointer(part));
      } else {
        anchor = decodeURI(hashMatch.substring(1));
      }
    }

    return new NodeLocation(origin, path, query, pointer, anchor);
  }

  public pushPointer(...parts: string[]) {
    if (this.anchor.length > 0) {
      throw new TypeError("cannot push to a location with an anchor");
    }

    return new NodeLocation(this.origin, this.path, this.query, [...this.pointer, ...parts], "");
  }

  public setAnchor(anchor: string) {
    if (this.pointer.length > 0) {
      throw new TypeError("cannot push to a location with a pointer");
    }

    return new NodeLocation(this.origin, this.path, this.query, [], anchor);
  }

  public join(other: NodeLocation) {
    // other has an origin, return that
    if (other.origin.length > 0) {
      return other;
    }

    if (other.path.length > 0) {
      // absolute paths replace this path
      if (other.path[0].length === 0) {
        return new NodeLocation(this.origin, other.path, other.query, other.pointer, other.anchor);
      } else {
        return new NodeLocation(
          this.origin,
          [...this.path.slice(0, -1), ...other.path],
          other.query,
          other.pointer,
          other.anchor,
        );
      }
    }

    if (other.query.length > 0) {
      return new NodeLocation(this.origin, this.path, other.query, other.pointer, other.anchor);
    }

    return new NodeLocation(this.origin, this.path, this.query, other.pointer, other.anchor);
  }

  public toRoot() {
    return new NodeLocation(this.origin, this.path, "", [], "");
  }

  public toString(alwaysIncludeHashSign = true) {
    const origin = this.origin;
    const path = this.path.map((part) => encodeURI(part)).join("/");
    const query = this.query;

    let hash;
    if (this.pointer.length > 0) {
      hash =
        "/" +
        this.pointer
          .map((part) => NodeLocation.escapePointer(part))
          .map((part) => encodeURI(part))
          .join("/");
    } else {
      hash = encodeURI(this.anchor);
    }
    if (alwaysIncludeHashSign || hash.length > 0) {
      hash = "#" + hash;
    }

    return origin + path + query + hash;
  }

  public static escapePointer(input: string) {
    return input.replaceAll("~", "~0").replaceAll("/", "~1");
  }

  public static unescapePointer(input: string) {
    return input.replaceAll("~1", "/").replaceAll("~0", "~");
  }
}
