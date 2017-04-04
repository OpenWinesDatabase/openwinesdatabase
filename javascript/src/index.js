import 'es6-shim';
import 'whatwg-fetch';
import Symbol from 'es-symbol';
import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import 'react-select/dist/react-select.css';

if (!window.Symbol) {
  window.Symbol = Symbol;
}
window.$ = $;
window.jQuery = $;
require('bootstrap/dist/js/bootstrap.min');

const App = (props) => <h1>Hello World!</h1>;

export function init(node) {
  ReactDOM.render(<App />, node);
}