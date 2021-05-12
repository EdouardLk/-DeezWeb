import firebaseConfig from './firebaseConfig.js';
import { addEvents } from './utils.js';

// ==============
// Initialisation
// ==============

firebase.initializeApp(firebaseConfig);

// Récupération de l'utilisateur connecté
//  (si Firebase le reconnaît, on le loggue immédiatement)
firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        let photoURL = user.photoURL;
        let displayName = user.displayName;

        // Affichage des infos
        member.classList.remove('d-none');
        member.querySelector('img').src = photoURL;
        member.querySelector('#member-name').textContent = displayName;
    } else {
        // S'il n'y a pas d'utilisateur, c'est qu'il n'est pas connecté
        //  (ou qu'il vient d'être déconnecté)
        window.location.href = 'login.html';
    }
});

// ==============
// Constantes DOM
// ==============

const member = document.querySelector('#member');
const logout = document.querySelector('#logout');

// ==========================
// Gestionnaires d'événéments
// ==========================

// Lorsqu'on se déconnecte via le menu
addEvents(logout, 'click', onLogout);

// =========
// Fonctions
// =========

// Lorsque l'utilisateur s'est déconnecté manuellement
function onLogout() {
   firebase.auth().signOut().then(() => {
       console.log('User loggued out');
   });
}
