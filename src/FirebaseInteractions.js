import firebase from 'firebase/compat/app'
import 'firebase/compat/database'
import 'firebase/compat/firestore'

const firebaseConfig = {
    apiKey: "AIzaSyCsa0VKW1ckT_RItl9mKOpZ7TwYuYVnT98",
    authDomain: "collect-dao.firebaseapp.com",
    projectId: "collect-dao",
    storageBucket: "collect-dao.appspot.com",
    messagingSenderId: "321640612974",
    appId: "1:321640612974:web:0dbde3c786a8823638527f",
    measurementId: "G-JE4XH6K2R1"
};

export let firebaseFunctionsUrl = "https://us-central1-collect-dao.cloudfunctions.net"
  
// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

export let getDAOAddress = async (profileId, pubId, cb) => {
    firebase.database().ref("globalDAOs").child(profileId + "_" + pubId).once('value').then((snapshot) => {
        if (snapshot.val()) {
            const children = snapshot.val()
            const govContractAddress = children["govContractAddress"]
            cb(govContractAddress)
        }
    })
}

// This ISN'T the wrapped collect
export let getDAOcollectNFTAddress = async (profileId, pubId, cb) => {
    firebase.database().ref("globalDAOs").child(profileId + "_" + pubId).once('value').then((snapshot) => {
        if (snapshot.val()) {
            const children = snapshot.val()
            const collectAddress = children["collectAddress"]
            cb(collectAddress)
        }
    })
}

export let getDAOWrappedCollectNFTAddress = async (profileId, pubId, cb) => {
    firebase.database().ref("globalDAOs").child(profileId + "_" + pubId).once('value').then((snapshot) => {
        if (snapshot.val()) {
            const children = snapshot.val()
            const wrappedCollectAddress = children["wrappedCollectAddress"]
            cb(wrappedCollectAddress)
        }
    })
}

export let isTokenStaked = async (profileId, pubId, tokenId, cb) => {
    firebase.database().ref("stakedTokens").child(profileId + "_" + pubId).child(tokenId).once('value').then((snapshot) => {
        if (snapshot.val()) {
            cb(true)
        }
        else {
            cb(false)
        }
    })
}

export let getGlobalDAOs = async (cb) => {
    firebase.database().ref("globalDAOs").once('value').then((snapshot) => {
        if (snapshot.val()) {
            var daos = []
            snapshot.forEach(function(item) {
                var obj = {}
                obj["key"] = item.key
                obj["profileId"] = item.key.split("_")[0]
                obj["pubId"] = item.key.split("_")[1]
                const children = item.val()
                obj["timestamp"] = children["timestamp"]
                daos.push(obj)
            })
            daos.sort((a, b) => {
                return b.timestamp - a.timestamp;
            });
            cb(daos)
        }
    })
}