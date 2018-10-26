import * as firebase from 'firebase';

import { fadeOutLoading } from 'loading';
import { getConnectionRef } from 'persistence';

function activateLandingPage() {
  fadeOutLoading();
  const dom = document.querySelector('#landing');
  dom.classList.add('active');
  const loginBtn = dom.querySelector('button')
  loginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithRedirect(provider);
  });
}

export default () => {
  const config = {
    apiKey: "AIzaSyDXhqlzBTf-o9H-YrG0zaG8RuPi2kxw5TY",
    authDomain: "auth.henryapp.io",
    databaseURL: "https://henry-8a09d.firebaseio.com",
    messagingSenderId: "209257396310",
    projectId: "henry-8a09d",
    storageBucket: "",
  };

  firebase.initializeApp(config);

  getConnectionRef().on('value', function(connectedSnap) {
    if (connectedSnap.val() === true) {
      console.debug('+++ Firebase is CONNECTED +++');
    } else {
      console.debug('--- Firebase is DISCONNECTED ---');
    }
  });

  return new Promise((resolve, reject) => {
    const unsubscribe = firebase.auth().onAuthStateChanged(user => {
      if (user) {
        // User is signed in.
        unsubscribe();
        resolve(user);
      } else {
        activateLandingPage();
      }
    });

    firebase.auth().getRedirectResult()
      .catch((error) => {
        reject(error);
      });
  });
};
