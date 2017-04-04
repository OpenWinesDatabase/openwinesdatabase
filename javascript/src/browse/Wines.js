import React, {Component} from 'react';

import { Link } from 'react-router';

export class Wines extends Component {

    render() {
        return (
            <div className="row text-left">
                {
                    this.props.wines.map(wine => (
                        <div key={wine.id} className="col-md-4">
                            <div className="list-entry-wines clearfix">
                                <div className="entry-wines-picture">
                                    {wine.externalPhotoUrl !== "undefined" && <img src={wine.externalPhotoUrl} className="img-responsive" />}
                                </div>
                                <div className="entry-wines-content">
                                    <b>{wine.name}</b>
                                    <br />
                                    {
                                        !this.props.showLinks && <span>{wine.region},&nbsp;</span>
                                    }
                                    {
                                        this.props.showLinks && <Link to={{ pathname: '/browse/wines', query: { country: wine.country, region: wine.region } }}>
                                            {wine.region},&nbsp;
                                        </Link>
                                    }
                                    {
                                        !this.props.showLinks && <span>{wine.country}</span>
                                    }
                                    {
                                        this.props.showLinks && <Link to={{ pathname: '/browse/regions', query: { country: wine.country } }}>
                                            {wine.country}
                                        </Link>
                                    }
                                    <br />
                                    {wine.year}
                                    <br />
                                    { window.__user &&
                                      <Link to={{ pathname: `/wine-form/${wine.id}`}}>
                                          Edit
                                      </Link>
                                    }
                                </div>

                            </div>
                        </div>
                    ))
                }
            </div>
        );
    }

}
