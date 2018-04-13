import React from 'react';
import { connect } from 'react-redux';

const App = () => {
  return (
    <h1>Yo</h1>
  );
};

function mapStateToProps(state) {
  return state;
}

export default connect(
  mapStateToProps,
)(App);
