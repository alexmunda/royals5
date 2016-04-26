import Cycle from '@cycle/core';
import {div, button, h1, h2, h4, a, ul, li, img, makeDOMDriver} from '@cycle/dom';
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
      div('.game-details-button-container .row', [
        button('.get-game-details .btn .btn-info', 'Will ROYALS5 work?')
      ]),      
      !hasData ? div('.not-loaded .row', [
        h1('.not-loaded-header', 'IDK, did the Royals score 5 runs or more and win? Click the button!')
      ]) : 
       div('.game-details-container .row', [
        royals5 ? div('.status-yes ', [          
          h1('.status-yes-header', 'YES!'),
          img('.salvy .img .img-responsive', {src: "http://cdn.fansided.com/wp-content/blogs.dir/220/files/2014/10/alcides-escobar-salvador-perez-mlb-al-wild-card-oakland-athletics-kansas-city-royals1-590x900.jpg"})
        ]) : div('.status-no', [          
          h1('.status-no-header', 'NO :('),
          img('.salvy-sad .img .img-responsive', {src: "http://www.newsobserver.com/news/nation-world/1tbux4/picture18733713/ALTERNATES/FREE_960/018.JPG"})
        ]),
        div('.game-details', [
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