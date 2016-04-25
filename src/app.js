import Cycle from '@cycle/core';
import {div, button, h1, h2, h4, a, ul, li, makeDOMDriver} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';

const STATS_URL = 'https://6xv5w2s8v3.execute-api.us-west-2.amazonaws.com/prod/getRoyalsScore';

//functional
const intent = (DOM) => {
  return {
    getGameDetails$: DOM.select('.get-game-details').events('click')
    .map(() => {
      return {
        url: STATS_URL,
        method: 'GET'
      };
    })
  };
};

function main(sources) {
  const actions = intent(sources.DOM);

  const stats$ = sources.HTTP
    .filter(res$ => res$.request.url.indexOf(STATS_URL) === 0)
    .mergeAll()
    .map(res => res.body)
    .startWith(null);

  const vtree$ = stats$.map(stat => {
    const royals5 = stat !== null && stat.score.royals >= 5 && stat.score.royals > stat.score.opponent;
    
    return div('.royals5-container', [
      button('.get-game-details .btn .btn-info', 'Will ROYALS5 work?'),
      stat == null ? div('.not-loaded', [
        h1('.not-loaded-header', 'IDK, did the Royals score 5 runs or more and win? Click the button!')
      ]) : 
      royals5 ? div('.game-details-container', [
        h1('.status-yes', 'YES!'),
        h2('.royals-score', `Royals: ${stat.score.royals}`),
        h2('.opponent-score', `Opponent: ${stat.score.opponent}`),
        div('.rbi-hitters-container',[
          h4('.rbi-header', 'Royals RBI Hitters'),
          ul('.rbi-hitters-list', stat.rbiHitters.map( hitter =>
            li('.rbi-hitter', hitter)
          ))
        ])
      ]) : 
      div('.no-container', [
        h2('.status-no', 'NO :(')
      ])
    ]);
  });

  const sinks = {
    DOM: vtree$,
    HTTP: actions.getGameDetails$
  };
  return sinks;
}

//imperative
const drivers = {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver()
};

Cycle.run(main, drivers);