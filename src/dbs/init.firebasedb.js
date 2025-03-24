'use strict';

const { initializeApp } = require("firebase/app");
const { getStorage } = require("firebase/storage");
const { firebaseConfig } = require('../configs/config.firebase');

class FirebaseDB {
    constructor() {
        this.app = initializeApp(firebaseConfig);
        this.storage = getStorage(this.app);
    }

    static getInstance() {
        if (!FirebaseDB.instance) {
            FirebaseDB.instance = new FirebaseDB();
        }
        return FirebaseDB.instance;
    }
}

const firebaseDB = FirebaseDB.getInstance();

module.exports = firebaseDB;