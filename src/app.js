import Cycle from '@cycle/core';
import {div, button, h1, h2, h4, a, ul, li, makeDOMDriver} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';

const intent = (DOM, HTTP) => {
  const GAME_DETAILS_URL = 'https://6xv5w2s8v3.execute-api.us-west-2.amazonaws.com/prod/getRoyalsScore';
  
  return {
    getGameDetails$: DOM.select('.get-game-details').events('click')
    .map(() => {
      return {
        url: GAME_DETAILS_URL,
        method: 'GET'
      };
    }),
    gameDetails$: HTTP
      .filter(res$ => res$.request.url.indexOf(GAME_DETAILS_URL) === 0)
      .mergeAll()
      .map(res => res.body)
      .startWith(null)
  };
};

const model = (actions) => {
  return actions.gameDetails$.map(gameDetail => {
    if(gameDetail == null) return {hasData: false};
    
    const {royals, opponent} = gameDetail.score;
    
    return {
      hasData: gameDetail !== null,
      royals5: gameDetail !== null && royals >= 5 && royals > opponent,
      royalsRuns: royals,
      opponentRuns: opponent,
      rbiHitters: gameDetail.rbiHitters,
      pitchers: gameDetail.pitchers
    }
  });
};

const view = (state$) => {
  return state$.map(({hasData, royals5, royalsRuns, opponentRuns, rbiHitters, pitchers}) =>
    div('.container', [
      button('.get-game-details .btn .btn-info', 'Will ROYALS5 work?'),
      !hasData ? div('.not-loaded', [
        h1('.not-loaded-header', 'IDK, did the Royals score 5 runs or more and win? Click the button!')
      ]) : 
       div('.game-details-container .col-lg-1 .col-centered', [
        royals5 ? h1('.status-yes', 'YES!') : h1('.status-no', 'NO :('),
        h2('.royals-score', `Royals: ${royalsRuns}`),
        h2('.opponent-score', `Opponent: ${opponentRuns}`),
        div('.royals-rbi-hitters-container .col-md-3',[
          h4('.royals-rbi-header', 'Royals RBI Hitters'),
          ul('.rbi-hitters-list', rbiHitters.royals.map( hitter =>
            li('.rbi-hitter', hitter)
          ))
        ]),
        div('.royals-pitchers-container .col-md-3', [
          h4('.royals-pitcher-header', 'Royals Pitcher'),
          ul('.pitcher-list', [
            li('.pitcher', pitchers.royals)
          ])
        ]),
        div('.opponent-rbi-hitters-container .col-md-3',[
          h4('.opponent-rbi-header', 'Opponent RBI Hitters'),
          ul('.rbi-hitters-list', rbiHitters.opponent.map( hitter =>
            li('.rbi-hitter', hitter)
          ))
        ]),
        div('.opponent-pitchers-container .col-md-3', [
          h4('.opponent-pitcher-header', 'Opponent Pitcher'),
          ul('.pitcher-list', [
            li('.pitcher', pitchers.opponent)
          ])
        ])
      ])
    ])
  );
}

function main(sources) {
  const actions = intent(sources.DOM, sources.HTTP);
  
  const state$ = model(actions);

  const sinks = {
    DOM: view(state$),
    HTTP: actions.getGameDetails$
  };
  return sinks;
}

const drivers = {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver()
};

Cycle.run(main, drivers);