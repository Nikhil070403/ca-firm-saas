const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Reads page/limit/sort/search + arbitrary field filters off req.query and
 * turns them into a shape every repository's paginate() understands. Field
 * filters are whitelisted per-call via `allowedFilters` so a client can't
 * inject an arbitrary Mongo query through the querystring.
 */
function parseListQuery(query, { searchableFields = [], allowedFilters = [] } = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;

  let sort = { createdAt: -1 };
  if (query.sort) {
    const direction = query.sort.startsWith('-') ? -1 : 1;
    const field = query.sort.replace(/^-/, '');
    sort = { [field]: direction };
  }

  const filters = {};
  allowedFilters.forEach((field) => {
    if (query[field] !== undefined && query[field] !== '') {
      filters[field] = query[field];
    }
  });

  let searchClause = null;
  if (query.search && searchableFields.length > 0) {
    const regex = new RegExp(escapeRegex(query.search), 'i');
    searchClause = { $or: searchableFields.map((field) => ({ [field]: regex })) };
  }

  return { page, limit, skip, sort, filters, searchClause };
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { parseListQuery, DEFAULT_LIMIT, MAX_LIMIT };
