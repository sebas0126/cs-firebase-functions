import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp(functions.config().firebase);

const firestore = admin.firestore();


const setTotal = function(ref, data, prevData){
  return firestore.runTransaction(t => {
    return t.get(ref)
      .then(doc => {
        let total = doc.data().totalMoney;
        if (!total) total = 0;
        total += data.money - prevData.money;
        t.set(ref, { totalMoney: total }, { merge: true });
      })
  })
}

//Get
export const helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from Firebase!");
});

exports.monthly_job =
  functions.pubsub.topic('monthly-tick').onPublish((event) => {
    console.log("This job is ran every month!")
  });

exports.createUser = functions.firestore
  .document('users/{userId}')
  .onCreate(event => {
    // Then return a promise of a set operation to update the count
    return event.data.ref.set({
      prueba: "Success!!!"
    }, { merge: true });
  });

exports.addMoney = functions.firestore
  .document('savings/{savingId}/users/{userId}/records/{recordId}')
  .onWrite(event => {
    const SAVING_ID = event.params.savingId;
    const USER_ID = event.params.userId;
    // const RECORD_ID = event.params.recordId;

    const data = event.data.data();
    let prevData = { money: 0 };
    if (event.data.previous && event.data.previous.exists) {
      prevData = event.data.previous.data();
    }

    if (data.money == prevData.money) {
      return Promise.reject;
    }

    const userRef = firestore.doc(`savings/${SAVING_ID}/users/${USER_ID}`);
    const savingRef = firestore.doc(`savings/${SAVING_ID}`);
    const setUserTotal = setTotal(userRef, data, prevData);
    const setSavingTotal = setTotal(savingRef, data, prevData);
    const setLastRecord = firestore.runTransaction(t => {
      return t.get(userRef)
        .then(doc => {
          t.set(userRef, { lastRecord: data }, {merge: true});
        })
    })

    return Promise.all([setUserTotal, setSavingTotal, setLastRecord]);
  });

exports.removeUserFromSaving = functions.firestore
  .document('savings/{savingId}/users/{userId}')
  .onDelete(event => {
    const SAVING_ID = event.params.savingId;
    const USER_ID = event.params.userId;
    const savingRef = firestore.doc(`savings/${SAVING_ID}`);
    const userRef = firestore.doc(`users/${USER_ID}`);
    const setUserSaving = firestore.runTransaction(t => {
      return t.get(userRef)
        .then(doc => {
          const savingsArr = doc.data().savings;
          if (!savingsArr) return;
          savingsArr.splice(savingsArr.indexOf(SAVING_ID));
          t.set(userRef, { savings: savingsArr }, { merge: true });
        })
    })
    const setCount = firestore.runTransaction(t => {
      return t.get(savingRef)
        .then(doc => {
          const newCount = doc.data().userCount - 1;
          t.update(savingRef, { userCount: newCount });
        })
    })
    return Promise.all([setUserSaving, setCount]);
  });

exports.addUserToSaving = functions.firestore
  .document('savings/{savingId}/users/{userId}')
  .onCreate(event => {
    const SAVING_ID = event.params.savingId;
    const USER_ID = event.params.userId;
    const savingRef = firestore.doc(`savings/${SAVING_ID}`);
    const userRef = firestore.doc(`users/${USER_ID}`);
    const setUserSaving = firestore.runTransaction(t => {
      return t.get(userRef)
        .then(doc => {
          let savingsArr = doc.data().savings;
          if (!savingsArr) {
            savingsArr = [];
          }
          savingsArr.push(SAVING_ID);
          t.set(userRef, { savings: savingsArr }, { merge: true });
        })
    })
    const setCount = firestore.runTransaction(t => {
      return t.get(savingRef)
        .then(doc => {
          const newCount = doc.data().userCount + 1;
          t.update(savingRef, { userCount: newCount });
        })
    })
    return Promise.all([setUserSaving, setCount]);
  });