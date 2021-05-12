import {addEvents} from './utils.js';
import firebaseConfig from './firebaseConfig.js';

firebase.initializeApp(firebaseConfig);

// Récupération de l'utilisateur connecté
//  (si Firebase le reconnaît, on le loggue immédiatement)
firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        redirect();
    }
});

const login = document.querySelector('#login');

addEvents(login, 'click', onLogin);

// Lorsqu'on clique sur le bouton "se connecter avec Github"
function onLogin() {
    let githubProvider = new firebase.auth.GithubAuthProvider();

    firebase.auth().signInWithPopup(githubProvider).then(redirect);
}

function redirect() {
    window.location.href = 'index.html';
}
