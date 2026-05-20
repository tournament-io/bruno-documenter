import extractExamples from '../extractExamples';

function seqOf(item) {
  return (item && item.info && typeof item.info.seq === 'number') ? item.info.seq : Infinity;
}

function bySeq(a, b) {
  return seqOf(a) - seqOf(b);
}

function getDocs(node) {
  if (!node || node.docs == null) return '';
  if (typeof node.docs === 'string') return node.docs;
  if (typeof node.docs === 'object' && typeof node.docs.content === 'string') return node.docs.content;
  return '';
}

function slug(str, fallback) {
  const s = (str || fallback || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return s || 'item';
}

function mapEnvironments(config) {
  if (!config || !Array.isArray(config.environments)) return [];

  const envs = config.environments.map(env => {
    const data = {};
    if (Array.isArray(env.variables)) {
      env.variables.forEach(v => {
        if (v && v.name != null) {
          data[v.name] = v.value != null ? String(v.value) : '';
        }
      });
    }
    return {
      name: env.name || 'Environment',
      data,
      color: null
    };
  });

  if (envs.length > 1) {
    return envs.slice(1);
  }
  return envs;
}

function mapHeaders(list) {
  if (!Array.isArray(list)) return [];
  return list.map(h => ({
    name: h.name,
    value: h.value != null ? String(h.value) : '',
    description: h.description || ''
  }));
}

function mapParams(list) {
  if (!Array.isArray(list)) return { query: [], path: [] };
  const query = [];
  const path = [];
  list.forEach(p => {
    const row = {
      name: p.name,
      value: p.value != null ? String(p.value) : '',
      description: p.description || ''
    };
    if (p.type === 'path') {
      path.push(row);
    } else {
      query.push(row);
    }
  });
  return { query, path };
}

function mapBody(body) {
  if (!body || !body.type) return undefined;
  switch (body.type) {
    case 'json':
      return { mimeType: 'application/json', text: typeof body.data === 'string' ? body.data : JSON.stringify(body.data || '', null, 2) };
    case 'text':
      return { mimeType: 'text/plain', text: body.data || '' };
    case 'xml':
      return { mimeType: 'application/xml', text: body.data || '' };
    case 'formUrlEncoded':
      return { mimeType: 'application/x-www-form-urlencoded', params: (body.data || []).map(p => ({ name: p.name, value: p.value, description: p.description || '' })) };
    case 'multipartForm':
      return { mimeType: 'multipart/form-data', params: (body.data || []).map(p => ({ name: p.name, value: p.value, description: p.description || '' })) };
    default:
      return { mimeType: body.type, text: typeof body.data === 'string' ? body.data : '' };
  }
}

function safeId(idPath) {
  return ('req-' + idPath).replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
}

function mapHttpRequest(item, idPath) {
  const http = item.http || {};
  const { query, path } = mapParams(http.params);
  const { description, exampleResponses } = extractExamples(getDocs(item));

  const parameters = [
    ...path.map(p => ({ ...p, description: p.description ? `(path) ${p.description}` : '(path)' })),
    ...query.map(p => ({ ...p, description: p.description ? `(query) ${p.description}` : '(query)' }))
  ];

  return {
    _id: safeId(idPath),
    _type: 'request',
    name: item.info && item.info.name ? item.info.name : '',
    method: (http.method || 'GET').toUpperCase(),
    url: http.url || '',
    headers: mapHeaders(http.headers),
    parameters,
    body: mapBody(http.body),
    description,
    exampleResponses
  };
}

function mapFolder(item, idPath) {
  const items = Array.isArray(item.items) ? [...item.items].sort(bySeq) : [];
  const children = [];
  const requests = [];

  items.forEach((child, i) => {
    if (!child || !child.info) return;
    const childId = `${idPath}/${slug(child.info.name, String(i))}`;
    if (child.info.type === 'folder') {
      children.push(mapFolder(child, childId));
    } else if (child.info.type === 'http') {
      requests.push(mapHttpRequest(child, childId));
    }
  });

  return {
    _id: safeId('grp-' + idPath),
    name: item.info && item.info.name ? item.info.name : '',
    description: getDocs(item),
    _type: 'request_group',
    children,
    requests
  };
}

export default function parseBruno(yaml) {
  const doc = yaml || {};
  const info = doc.info || {};
  const items = Array.isArray(doc.items) ? [...doc.items].sort(bySeq) : [];

  const groups = [];
  const requests = [];

  items.forEach((item, i) => {
    if (!item || !item.info) return;
    const id = `/${slug(item.info.name, String(i))}`;
    if (item.info.type === 'folder') {
      groups.push(mapFolder(item, id));
    } else if (item.info.type === 'http') {
      requests.push(mapHttpRequest(item, id));
    }
  });

  return {
    workspace: {
      name: info.name || 'API',
      description: getDocs(doc) || info.description || ''
    },
    cookiejars: [],
    environments: mapEnvironments(doc.config),
    groups,
    requests
  };
}
