import Cycle from '@cycle/core';
import {div, button, h1, h2, h4, a, ul, li, img, makeDOMDriver} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';
import {Observable} from 'Rx';

const intent = (DOM, HTTP) => {
  const GAME_DETAILS_URL = 'https://6xv5w2s8v3.execute-api.us-west-2.amazonaws.com/prod/getRoyalsScore';

  return {
    getGameDetails$: Observable.merge(Observable.just({
      url: GAME_DETAILS_URL,
      method: 'GET'
    }), DOM.select('.get-game-details').events('click')
      .map(() => {
        return {
          url: GAME_DETAILS_URL,
          method: 'GET'
        };
      })
    ),
    gameDetails$: HTTP
      .filter(res$ => res$.request.url.indexOf(GAME_DETAILS_URL) === 0)
      .mergeAll()
      .map(res => res.body)
      .startWith(null)
  };
};

const model = (actions) => {
  return actions.gameDetails$.map(gameDetail => {
    if (gameDetail == null) return { hasData: false };

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
    div('.container .game-details', [
      div('.game-details-button-container .row', [
        button('.get-game-details .btn .btn-info', 'Refresh')
      ]),
      !hasData ? div('.not-loaded .row', [
        h1('.not-loaded-header', 'Loading...')
      ]) :
        div('.game-details-container .row', [
          royals5 ? div('.status-yes ', [
            h1('.status-yes-header', 'YES!'),
            img('.salvy .img .img-responsive .center-block', { src: "http://cdn.fansided.com/wp-content/blogs.dir/220/files/2014/10/alcides-escobar-salvador-perez-mlb-al-wild-card-oakland-athletics-kansas-city-royals1-590x900.jpg" })
          ]) : div('.status-no', [
            h1('.status-no-header', 'NO :('),
            img('.salvy-sad .img .img-responsive .center-block', { src: "http://www.newsobserver.com/news/nation-world/1tbux4/picture18733713/ALTERNATES/FREE_960/018.JPG" })
          ]),
          div('.game-details', [
            h2('.royals-score', `Royals: ${royalsRuns}`),
            h2('.opponent-score', `Opponent: ${opponentRuns}`),
            rbiHittersContainer({
              prop$: Observable.of({
                team: 'royals',
                rbiHitters: rbiHitters.royals
              })
            }).DOM,
            pitchersContainer({
              prop$: Observable.of({
                team: 'royals',
                pitcher: pitchers.royals
              })
            }).DOM,
            rbiHittersContainer({
              prop$: Observable.of({
                team: 'opponent',
                rbiHitters: rbiHitters.opponent
              })
            }).DOM,
            pitchersContainer({
              prop$: Observable.of({
                team: 'opponent',
                pitcher: pitchers.opponent
              })
            }).DOM
          ])
        ])
    ])
  );
}

function rbiHittersContainer(sources) {
  const prop$ = sources.prop$;

  const vtree$ = prop$.map(props =>
    div(`.${props.team}-rbi-hitters-container .col-md-3`, [
      h4(`.${props.team}-rbi-header .first-letter`, `${props.team} RBI Hitters`),
      ul('.rbi-hitters-list .list-group', props.rbiHitters.map(hitter =>
        li('.rbi-hitter .list-group-item', hitter)
      ))
    ]));

  return {
    DOM: vtree$
  }
}

function pitchersContainer(sources) {
  const prop$ = sources.prop$;

  const vtree$ = prop$.map(props =>
    div(`.${props.team}-pitchers-container .col-md-3`, [
      h4(`.${props.team}-pitcher-header .first-letter`, `${props.team} Pitcher`),
      ul('.pitcher-list .list-group', [
        li('.pitcher .list-group-item', props.pitcher)
      ])
    ]));

  return {
    DOM: vtree$
  }
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