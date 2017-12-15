"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
// // Start writing Firebase Functions
// // https://firebase.google.com/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello from Firebase!");
});
exports.createUser = functions.firestore
    .document('users/{userId}')
    .onCreate(event => {
    // Retrieve the current and previous value
    const data = event.data.data();
    // Then return a promise of a set operation to update the count
    return event.data.ref.set({
        prueba: "Success!!!"
    }, { merge: true });
});
//# sourceMappingURL=index.js.map