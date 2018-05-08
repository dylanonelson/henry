import * as firebase from 'firebase';

export default () => {
  const config = {
    apiKey: "AIzaSyDXhqlzBTf-o9H-YrG0zaG8RuPi2kxw5TY",
    authDomain: "henry-8a09d.firebaseapp.com",
    databaseURL: "https://henry-8a09d.firebaseio.com",
    messagingSenderId: "209257396310",
    projectId: "henry-8a09d",
    storageBucket: "",
  };

  firebase.initializeApp(config);

  firebase.database().ref('.info/connected').on('value', function(connectedSnap) {
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
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithRedirect(provider);
      }
    });

    firebase.auth().getRedirectResult()
      .catch((error) => {
        reject(error);
      });
  });
};
