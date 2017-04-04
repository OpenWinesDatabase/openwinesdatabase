import React, {Component} from 'react';
import { Link } from 'react-router';

export class BrowseRegions extends Component {

    state = {
        loading: true,
        regions: []
    };

    componentDidMount() {
        fetch(`/api/regions?country=${this.props.location.query.country}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        }).then(r => r.json()).then(data => {
            this.setState({
                regions: data.regions,
                loading: false
            });
        });
    }

    goBack = () => this.props.router.goBack();

    render() {
        return (
            <div className="text-center">
                <div className="page-header">
                    <h1>Regions of {this.props.location.query.country}</h1>
                </div>

                <a className="btn btn-default btn-return" role="button" onClick={this.goBack} style={{ marginBottom: 16 }}>
                    <span className="glyphicon glyphicon-chevron-left"></span>
                </a>

                {
                    this.state.loading && (
                        <div className="progress" style={{ width: '100%' }}>
                            <div className="progress-bar progress-bar-striped active" role="progressbar" style={{ width: '100%' }}></div>
                        </div>
                    )
                }

                <div className="row">
                {
                    this.state.regions.map(region => (
                        <div className="col-sm-4" key={region.name}>
                            <div className="list-entry">
                                <Link to={{ pathname: '/browse/wines', query: { country: this.props.location.query.country, region: region.name } }}>
                                    {region.name}
                                </Link>
                                <span className="badge">{region.totalWines}</span>
                            </div>
                        </div>
                    ))
                }
                </div>

                <a className="btn btn-default btn-return" role="button" onClick={this.goBack}>
                    <span className="glyphicon glyphicon-chevron-left"></span>
                </a>
            </div>
        )
    }

}
