import yaml from 'js-yaml';
import App from './App.svelte';
import ErrorPage from './ErrorPage.svelte';
import parseBruno from './lib/bruno/parseBruno';

async function app() {
  const root = document.getElementById('app');
  const rootPath = root.getAttribute('data-root') || '';

  const url = process.env.NODE_ENV === 'demo'
    ? '/bruno-documenter/bruno.yml'
    : `${rootPath}/bruno.yml`;

  window.BRUNO_URL = url;

  try {
    const text = await fetch(url, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/x-yaml, text/yaml, text/plain'
      }
    }).then(res => res.text());

    const doc = yaml.load(text);
    const config = parseBruno(doc);

    return new App({
      target: root,
      props: { config }
    });
  } catch (err) {
    console.error(err);

    return new ErrorPage({
      target: root
    });
  }
}

export default app();
