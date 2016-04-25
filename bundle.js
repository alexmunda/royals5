/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	import Cycle from '@cycle/core';
	import { div, button, h1, h2, h4, a, ul, li, makeDOMDriver } from '@cycle/dom';
	import { makeHTTPDriver } from '@cycle/http';

	//functional
	function main(sources) {
	  const STATS_URL = 'https://6xv5w2s8v3.execute-api.us-west-2.amazonaws.com/prod/getRoyalsScore';

	  const getRandomUser$ = sources.DOM.select('.get-game-details').events('click').map(() => {
	    return {
	      url: STATS_URL,
	      method: 'GET'
	    };
	  });

	  const stats$ = sources.HTTP.filter(res$ => res$.request.url.indexOf(STATS_URL) === 0).mergeAll().map(res => res.body).startWith(null);

	  const vtree$ = stats$.map(stat => {
	    const royals5 = stat !== null && stat.score.royals >= 5 && stat.score.royals > stat.score.opponent;

	    return div('.royals5-container', [button('.get-game-details .btn .btn-info', 'Will ROYALS5 work?'), stat == null ? div('.not-loaded', [h1('.not-loaded-header', 'IDK, did the Royals score 5 runs or more and win? Click the button!')]) : royals5 ? div('.game-details-container', [h1('.status-yes', 'YES!'), h2('.royals-score', `Royals: ${ stat.score.royals }`), h2('.opponent-score', `Opponent: ${ stat.score.opponent }`), div('.rbi-hitters-container', [h4('.rbi-header', 'Royals RBI Hitters'), ul('.rbi-hitters-list', stat.rbiHitters.map(hitter => li('.rbi-hitter', hitter)))])]) : div('.no-container', [h2('.status-no', 'NO :(')])]);
	  });

	  const sinks = {
	    DOM: vtree$,
	    HTTP: getRandomUser$
	  };
	  return sinks;
	}

	//imperative
	const drivers = {
	  DOM: makeDOMDriver('#app'),
	  HTTP: makeHTTPDriver()
	};

	Cycle.run(main, drivers);

/***/ }
/******/ ]);