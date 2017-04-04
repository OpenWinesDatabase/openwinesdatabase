import React, {Component} from 'react';
import { Link } from 'react-router';

export class BrowseCountries extends Component {

    state = {
        loading: true,
        countries: []
    };

    componentDidMount() {
        fetch(`/api/countries`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        }).then(r => r.json()).then(data => {
            this.setState({
                countries: data.countries,
                loading: false
            });
        });
    }

    render() {
        return (
            <div className="text-center">
                <div className="page-header">
                    <h1>Countries</h1>
                </div>
                {
                    this.state.loading && (
                        <div className="progress" style={{ width: '100%' }}>
                            <div className="progress-bar progress-bar-striped active" role="progressbar" style={{ width: '100%' }}></div>
                        </div>
                    )
                }

                <div className="row">
                {
                    this.state.countries.map(country => (
                        <div className="col-sm-4" key={country.name}>
                            <div className="list-entry">
                                <Link to={{ pathname: '/browse/regions', query: { country: country.name } }}>
                                    {country.name}
                                </Link>
                                <span className="badge">{country.totalWines}</span>
                            </div>
                        </div>
                    ))
                }
                </div>
            </div>
        )
    }

}
