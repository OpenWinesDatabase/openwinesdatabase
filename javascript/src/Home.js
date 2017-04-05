import React, { Component } from 'react';
import { Link } from 'react-router'

export class Home extends Component {

    state = {
        searchQuery: ""
    };

    componentDidMount() {
        this.searchQueryInput.focus();
    }

    handleSearchQueryChange = (event) => {
        this.setState({ searchQuery: event.target.value });
    };

    goToSearch = (e) => {
        e.preventDefault();
        this.props.router.push({
            pathname: '/search',
            query: { q: this.state.searchQuery }
        })
    };

    gotoSnap = (e) => {
        e.preventDefault();
        this.props.router.push({
            pathname: '/snap'
        })
    };

    handleSearchQueryKeypress = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            this.goToSearch(event)
        }
    };

    render() {
        return (
            <div className="text-center">

                <div className="page-header">
                    <h1>Search a wine!</h1>
                </div>
                <div className="home-form-container">
                    <form style={{ marginTop: 32 }}>
                        <div className="form-group">
                            <input id="searchQuery"
                                   type="text"
                                   className="form-control input-lg"
                                   placeholder="Château Haut Brion 1982"
                                   value={this.state.searchQuery}
                                   onChange={this.handleSearchQueryChange}
                                   onKeyPress={this.handleSearchQueryKeypress}
                                   ref={(input) => { this.searchQueryInput = input; }}
                            />
                        </div>
                        <div className="form-action-container">
                            <a className="" onClick={this.goToSearch}>
                                <span className="glyphicon glyphicon-search" /> Go!
                            </a>
                        </div>
                    </form>
                </div>
                <div style={{ marginTop: 16 }}>
                    <Link to="/browse/countries">or browse the database...</Link>
                </div>
            </div>
        )
    }

}
