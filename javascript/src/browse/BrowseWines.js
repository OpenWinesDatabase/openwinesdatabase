import React, {Component} from 'react';

import { Wines } from './Wines';

export class BrowseWines extends Component {

    state = {
        loading: true,
        wines: []
    };

    componentDidMount() {
        fetch(`/api/wines?country=${this.props.location.query.country}&region=${this.props.location.query.region}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        }).then(r => r.json()).then(data => {
            this.setState({
                wines: data.wines,
                loading: false
            });
        });
    }

    goBack = () => this.props.router.goBack();

    render() {
        return (
            <div className="text-center">
                <div className="page-header">
                    <h1>Wines from {this.props.location.query.region}, {this.props.location.query.country}</h1>
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

                <Wines wines={this.state.wines} showLinks={false}/>

                <a className="btn btn-default btn-return" role="button" onClick={this.goBack}>
                    <span className="glyphicon glyphicon-chevron-left"></span>
                </a>
            </div>
        )
    }

}
