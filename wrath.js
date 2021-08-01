"use strict";

const admin = require('firebase-admin');
const db = admin.firestore();

// var ledger = {
//   docs:0,
//   collections:0
// };

module.exports = {

  checkSubCollections : async function(ref){

    // console.log('>>> checking sub collections for the doc');
    //console.log('.............');
    //console.log(ref['_referencePath']);
    //console.log('.............');

    return ref.listCollections()
    .then((collections)=>{
      // console.log(";;;;;;;;;;");
      let bank = [];
      collections.forEach((collection)=>{
        bank.push(collection.id);
      });
      return bank;
    })
    .catch((error)=>{
      console.log("fagagagag");
      console.log(error);
      return false;
    });

  },

  processDoc : async function(ref){

    // console.log('>>> processing doc');
    //console.log(',,,,,,,,,,,,,');
    //console.log(ref['_referencePath']);
    //console.log(',,,,,,,,,,,,,');

    //check for sub collections

    let checkSubCollections = await this.checkSubCollections(ref);

    // console.log({checkSubCollections:checkSubCollections});
    //process sub collections

    let promises = [];

    if(checkSubCollections.length > 0){
      for(var i=0;i<checkSubCollections.length;i++){
        promises.push(this.processCollection(ref.collection(checkSubCollections[i])));
      }
    }

    //process promise

    await Promise.all(promises)
    .then((results)=>{
      //console.log('----------');
      //console.log('>>> sub collection processing results');
      //console.log(results);
    });

    //delete doc

    return ref.delete()
    .then(()=>{
      // ledger['docs'] += 1;
      //console.log('--- doc deleted');
      return true;
    })
    .catch((error)=>{
      console.log(error);
      return false;
    });

  },

  processCollection : async function(ref){

    // console.log('>>> processing collection');
    //console.log('========');
    //console.log(ref['_referencePath']);
    //console.log('========');

    //get all the docs

    let docs = await ref.get()
    .then((querySnapshot)=>{
      if(!querySnapshot.empty){
        let bank = [];
        querySnapshot.forEach((doc)=>{
          bank.push(doc.ref);
        });
        return bank;
      }
      if(querySnapshot.empty){
        return null;
      }
    })
    .catch((error)=>{
      console.log(error);
      return false;
    });

    if(docs == false){
      console.log('!!! error while getting docs from this collection');
      return false;
    }

    if(docs == null){
      console.log('!!! no docs found from this collection');
      return false;
    }

    // ledger['collections'] += 1;

    //process all the docs

    let promises = [];

    for(var i=0;i<docs.length;i++){
      promises.push(this.processDoc(docs[i]));
    }

    //complete the process

    return Promise.all(promises)
    .then((results)=>{
      //console.log('^^^^^^^^^^^^^^^^^^');
      //console.log('>>> documents processing results');
      //console.log(results);
      return true;
    });

  },

  clearCollection : async function(ref){
    //console.log('>>> clearing collection');
    let result = await this.processCollection(ref);
    //console.log('>>> collections deleted : ' + ledger.collections);
    //console.log('>>> docs deleted : ' + ledger.docs);
    return result;
  },

  clearDoc : async function(ref){
    // console.log('>>> clearing doc');
    let result = await this.processDoc(ref);
    console.log({result:result});
    // console.log('>>> collections deleted : ' + ledger.collections);
    // console.log('>>> docs deleted : ' + ledger.docs);
    return result;
  }

};
