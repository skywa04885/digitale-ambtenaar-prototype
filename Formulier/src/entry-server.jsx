import { renderToString } from 'react-dom/server';
import App from './App.jsx';
import './styles.css';

export function render(_url, initialData) {
  return {
    html: renderToString(<App initialData={initialData} />)
  };
}
