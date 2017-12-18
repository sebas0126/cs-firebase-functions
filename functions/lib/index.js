"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
const firestore = admin.firestore();
//Get
exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello from Firebase!");
});
exports.createUser = functions.firestore
    .document('users/{userId}')
    .onCreate(event => {
    // Then return a promise of a set operation to update the count
    return event.data.ref.set({
        prueba: "Success!!!"
    }, { merge: true });
});
exports.removeUserFromSaving = functions.firestore
    .document('savings/{savingId}/users/{userId}')
    .onDelete(event => {
    const savingRef = firestore.doc(`savings/${event.params.savingId}`);
    const userRef = firestore.doc(`users/${event.params.userId}`);
    // const setUserSaving = firestore.doc(`users/${event.params.userId}`).set(data, { merge: true })
    const setUserSaving = firestore.runTransaction(t => {
        return t.get(userRef)
            .then(doc => {
            const savingsArr = doc.data().savings;
            if (!savingsArr)
                return;
            savingsArr.splice(savingsArr.indexOf(event.params.savingId));
            t.set(userRef, { savings: savingsArr }, { merge: true });
        });
    });
    const setCount = firestore.runTransaction(t => {
        return t.get(savingRef)
            .then(doc => {
            const newCount = doc.data().userCount - 1;
            t.update(savingRef, { userCount: newCount });
        });
    });
    return Promise.all([setUserSaving, setCount]);
});
exports.addUserToSaving = functions.firestore
    .document('savings/{savingId}/users/{userId}')
    .onCreate(event => {
    const savingRef = firestore.doc(`savings/${event.params.savingId}`);
    const userRef = firestore.doc(`users/${event.params.userId}`);
    // const setUserSaving = firestore.doc(`users/${event.params.userId}`).set(data, { merge: true })
    const setUserSaving = firestore.runTransaction(t => {
        return t.get(userRef)
            .then(doc => {
            let savingsArr = doc.data().savings;
            if (!savingsArr) {
                savingsArr = [];
            }
            savingsArr.push(event.params.savingId);
            t.set(userRef, { savings: savingsArr }, { merge: true });
        });
    });
    const setCount = firestore.runTransaction(t => {
        return t.get(savingRef)
            .then(doc => {
            const newCount = doc.data().userCount + 1;
            t.update(savingRef, { userCount: newCount });
        });
    });
    return Promise.all([setUserSaving, setCount]);
});
//# sourceMappingURL=index.js.map