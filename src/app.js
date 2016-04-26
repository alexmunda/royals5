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
      rbiHitters: gameDetail.score.rbiHitters,
      winningPitcher: gameDetail.score.winningPitcher
    }
  });
};

const view = (state$) => {
  return state$.map(({hasData, royals5, royalsRuns, opponentRuns, rbiHitters, winningPitcher}) =>
    div('.container', [
      button('.get-game-details .btn .btn-info', 'Will ROYALS5 work?'),
      !hasData ? div('.not-loaded', [
        h1('.not-loaded-header', 'IDK, did the Royals score 5 runs or more and win? Click the button!')
      ]) : 
      royals5 ? div('.game-details-container', [
        h1('.status-yes', 'YES!'),
        h2('.royals-score', `Royals: ${royalsRuns}`),
        h2('.opponent-score', `Opponent: ${opponentRuns}`),
        div('.rbi-hitters-container',[
          h4('.rbi-header', 'Royals RBI Hitters'),
          ul('.rbi-hitters-list', rbiHitters.map( hitter =>
            li('.rbi-hitter', hitter)
          ))
        ]),
        div('.pitchers-container', [
          h4('.pitcher-header', 'Royals Pitcher'),
          ul('.pitcher-list', () =>
            li('.pitcher', winningPitcher)
          )
        ])
      ]) : 
      div('.no-container', [
        h2('.status-no', 'NO :(')
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