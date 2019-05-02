export function escapeLiteral(str: string, escape_val: string = '\'') {
  var hasBackslash = false;
  var escaped = escape_val;
  for (var i = 0; i < str.length; i++) {
    var c = str[i];
    if (c === escape_val) {
      escaped += c + c;
    } else if (c === '\\') {
      escaped += c + c;
      hasBackslash = true;
    } else {
      escaped += c;
    }
  }
  escaped += escape_val;
  if (hasBackslash === true) {
    escaped = ' E' + escaped;
  }
  return escaped;
}

export function buildLimit(limit?: number, offset?: number) {
  var clause = [];
  if (limit === undefined || isNaN(limit)) {
    limit = 0;
  }
  if (offset === undefined || isNaN(offset)) {
    offset = 0;
  }
  if (!limit && !offset) {
    return '';
  }
  if (limit) {
    clause.push('LIMIT ' + limit);
  }
  if (offset) {
    clause.push('OFFSET ' + offset);
  }
  return clause.join(' ');
}
