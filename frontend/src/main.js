import App from './App.svelte';
import './app.css';

// Check for embed mode via URL param or path
const urlParams = new URLSearchParams(window.location.search);
const isEmbed = urlParams.get('embed') === 'true' ||
                window.location.pathname.startsWith('/embed') ||
                window.location.pathname.startsWith('/notion');

// Add embed class to html element for CSS targeting
if (isEmbed) {
  document.documentElement.classList.add('embed-mode');
}

const app = new App({
  target: document.getElementById('app'),
  props: {
    embedMode: isEmbed
  }
});

export default app;
