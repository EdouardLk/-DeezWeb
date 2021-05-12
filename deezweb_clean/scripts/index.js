import './authentication.js';

import fetchJsonp from '../lib/fetch-jsonp.js';
import {debounce, addEvents} from './utils.js';
import {renderSongs, onPlay, onTogglePlayPause} from './functions.js';
import firebaseService from './firebaseService.js';

const form = document.querySelector('form');
const results = document.querySelector('#results-list');
const resultsContainer = document.querySelector('#search-results');
const success = resultsContainer.querySelector('.text-success');
const error = resultsContainer.querySelector('.text-danger');
const player = document.querySelector('#player-container audio');

let nextURL = '';
let resultsLoaded = true;

// Lorsqu'on valide le formulaire
addEvents(form, 'submit', onFormSubmit);
// Lorsqu'on scrolle dans la page
addEvents(document, 'scroll', debounce(onScroll, 50));
// Lorsqu'on clique sur un bouton "Ecouter"
addEvents(resultsContainer, 'click', '.play-button', onPlay);
// Lorsqu'on joue/stoppe la lecture du player <audio> de la .navbar
addEvents(player, 'play pause', onTogglePlayPause);
// Lorsqu'on clique sur un bouton de mise en favoris
addEvents(resultsContainer, 'click', '.fav-button', onToggleFavorite);

function onScroll() {
    let positionAscenseur = Math.ceil(window.scrollY);
    let hauteurDocument = document.documentElement.scrollHeight;
    let hauteurFenetre = window.innerHeight;

    if (positionAscenseur >= hauteurDocument - hauteurFenetre) {
        console.log('Bas de page atteint ! Chargement des résultats suivants ...');
        loadNextResults();
    }
}

function loadNextResults() {
    if (nextURL && resultsLoaded) {
        // Création et affichage d'un spinner
        const spinner = document.createElement('div');
        spinner.classList.add('spinner', 'm-auto');
        resultsContainer.appendChild(spinner);

        resultsLoaded = false;

        let deezerData;

        fetchJsonp(nextURL)
            .then(res => res.json())
            .then(({ data, next }) => {
                nextURL = next;
                resultsLoaded = true;

                deezerData = data;

                // Supprime le spinner
                spinner.parentNode.removeChild(spinner);
            })
            .then(() => firebaseService.getCurrentUserFavorites())
            .then(userFavorites => {
                userFavorites = userFavorites.map(fav => fav[1]);

                // Rendering du HTML des musiques
                let html = renderSongs(deezerData, userFavorites);

                results.innerHTML += html;
            });
    }
}

function onFormSubmit(event) {
    /* Empêche l'action par defaut du navigateur, qui est
     de recharger la page web */
    event.preventDefault();

    let searchValue = document.querySelector('#searchText').value;

    // Création et affichage d'un spinner
    const spinner = document.createElement('div');
    spinner.classList.add('spinner');
    form.appendChild(spinner);

    let deezerData, deezerTotal;

    // Lancement de la requête Ajax vers Deezer
    fetchJsonp(`https://api.deezer.com/search?q=${searchValue}&output=jsonp`)
        .then(res => res.json())
        .then(({ data, total, next }) => {
            // On conserve l'URL pour la prochaine requête, que l'on fera au scroll en arrivant en bas de page
            nextURL = next;
            resultsLoaded = true;

            deezerData = data;
            deezerTotal = total;

            // Supprime le spinner
            spinner.parentNode.removeChild(spinner);

            // Affichage de la zone de résultats
            resultsContainer.classList.remove('d-none');
        })
        .then(() => firebaseService.getCurrentUserFavorites())
        .then(userFavorites => {
            // On n'a ici besoin que du tableau d'objets et non du pushId de Firebase
            userFavorites = userFavorites.map(fav => fav[1]);

            success.classList.remove('d-none');
            success.querySelector('strong').textContent = deezerTotal;
            error.classList.add('d-none');
            
            // Rendering du HTML des musiques
            let html = renderSongs(deezerData, userFavorites);

            results.innerHTML = html;
        })
        .catch(err => {
            console.error(err);
            success.classList.add('d-none');
            error.classList.remove('d-none');
            error.querySelector('strong').textContent = err;
        });
}

function onToggleFavorite() {
    let favButton = this;
    // Récupérer un identifiant unique permettant d'identifier la musique
    let clickedSongID = favButton.closest('.song').dataset.songId;
    clickedSongID = Number(clickedSongID);

    // Passe le bouton en mode attente ("…")
    setButtonMode(favButton, 'waiting');

    // Récupération des favoris de l'utilisateur
    firebaseService.getCurrentUserFavorites().then(userFavorites => {
        // Vérifie si l'identifiant "clickedSongID" n'est pas déjà dans les favoris
        let fav = userFavorites.find(([pushId,song]) => song.id === clickedSongID);

        // Si OUI : on la retire
        if (fav) {
            let pushId = fav[0];

            firebaseService
                .removeFavoriteForCurrentUser(pushId)
                .then(() => setButtonMode(favButton, 'normal'));
        }
        // Si NON : on l'ajoute
        else {
            fetchJsonp(`https://api.deezer.com/track/${clickedSongID}/?output=jsonp`)
                .then(res => res.json())
                .then(response => firebaseService.addFavoriteForCurrentUser(response))
                .then(() => setButtonMode(favButton, 'highlighted'));
        }
    });
}

function setButtonMode(buttonElement, mode = 'normal') {
    switch (mode) {
        case 'normal':
            buttonElement.classList.remove('btn-danger', 'disabled');
            buttonElement.textContent = '🤍';
            buttonElement.title = 'Ajouter aux favoris';
            buttonElement.disabled = false;
            break;

        case 'waiting':
            buttonElement.textContent = '...';
            buttonElement.classList.add('disabled');
            buttonElement.disabled = true;
            break;

        case 'highlighted':
            buttonElement.classList.remove('disabled');
            buttonElement.classList.add('btn-danger');
            buttonElement.textContent = '❤';
            buttonElement.title = 'Retirer des favoris';
            buttonElement.disabled = false;
            break;
    }
}
