import React, { Component } from 'react';
import { Router, Route, IndexRoute, Link, browserHistory } from 'react-router';

import { Home } from './Home';
import { Home2 } from './Home2';
import { SearchWines } from './browse/SearchWines';
import { BrowseCountries } from './browse//BrowseCountries';
import { BrowseRegions } from './browse//BrowseRegions';
import { BrowseWines } from './browse//BrowseWines';
import { Snap } from './snap/Snap';
import { WineForm } from './cud/WineForm';

const App = React.createClass({
    render() {
        return (
            <div>
                {this.props.children}
            </div>
        )
    }
});

browserHistory.listen(function (location) {
    if (window.ga) {
        window.ga('send', 'pageview', location.pathname + location.search);
    }
});

export class RoutedApp extends Component {
    render() {
        return (
            <Router history={browserHistory}>
                <Route path="/" component={App}>
                    <IndexRoute component={Home} />
                    <Route path="home" component={Home2} />
                    <Route path="search" component={SearchWines} />
                    <Route path="browse/countries" component={BrowseCountries} />
                    <Route path="browse/regions" component={BrowseRegions} />
                    <Route path="browse/wines" component={BrowseWines} />
                    <Route path="snap" component={Snap} />
                    <Route path="wine-form/:id" component={WineForm} />
                    <Route path="wine-form" component={WineForm} />
                </Route>
            </Router>
        )
    }
}
