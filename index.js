"use strict";

global.firebase = require('firebase-admin');
const fieldvalue = firebase.firestore.FieldValue;

module.exports = {

  type:'firestore',

  db : null,

  init :async function(auth){
    try{
      let start = await firebase.initializeApp({
        credential: firebase.credential.cert(auth.cred),
        databaseURL: auth.db
      });
      this.db = firebase.firestore();
      const settings = {timestampsInSnapshots: true};
      this.db.settings(settings);
      return true;
    }
    catch(e){
      return new engine.common.Error("failed-start-firebase-admin => " + JSON.stringify(e));
    }
  },

  processAddress : function(address){

    if(this.db == null || address == null || address == undefined){
      return false;
    }

    let local = this.db;

    for(var i=0;i<address.length;i++){

      let item = address[i];

      if(item.type == 'doc'){
        local = local.doc(item.query);
      } else if(item.type == 'collection'){
        local = local.collection(item.query);
      } else if(item.type == 'where'){
        local = local.where(item.query[0],item.query[1],item.query[2]);
      } else if(item.type == 'after'){
        local = local.startAfter(item.query);
      } else if(item.type == 'before'){
        local = local.endBefore(item.query);
      } else if(item.type == 'offset'){
        local = local.offset(item.query);
      } else if(item.type == 'orderBy'){
        if(item.query.direction == 'asc'){
          local = local.orderBy(item.query.index,'asc');
        } else {
          local = local.orderBy(item.query.index,'desc');
        }
      } else if(item.type == 'limit'){
        local = local.limit(item.query);
      }

    }

    return local;

  },

  get : function(builder,session){

    return new Promise((resolve,reject)=>{

      let address = this.processAddress(builder.address);
      let last = builder.lastType;
      let query = address.get();

      if(last == 'doc'){
        return query.then((doc)=>{
          if(builder.raw){
            resolve(doc);
          }
          else if(builder.find){
            resolve({exists:doc.exists});
          } 
          else {
            resolve(doc.data());
          }
        })
        .catch((error)=>{
          reject(error);
        });
      } else if(last == 'collection'){
        return query.then((querySnapshot)=>{
          let data = [];
          let index = 1;
          let last_doc;
          querySnapshot.forEach((doc)=>{
            data.push(doc.data());
            if(builder.raw){
              if(index === querySnapshot.size){
                last_doc = doc;
              }
              index++;
            }
          });
          if(builder.raw){resolve({docs:data,last:last_doc});} else {resolve(data);}
        })
        .catch((error)=>{
          reject(error);
        });
      } else {
        reject('invalid_global_address');
      }

    });

  },

  insert : function(object,builder){
    return new Promise((resolve,reject)=>{
      let address = this.processAddress(builder.address);
      return address.set(object)
      .then(()=>{
        resolve();
      })
      .catch((error)=>{
        reject(error);
      });
    });
  },

  update : function(object,builder){
    return new Promise((resolve,reject)=>{
      let address = this.processAddress(builder.address);
      return address.update(object)
      .then(()=>{
        resolve();
      })
      .catch((error)=>{
        reject(error);
      });
    });
  },

  increment : function(object,builder){
    return new Promise((resolve,reject)=>{
      let build = {};
      for(let key in object){
        build[key] = fieldvalue.increment(object[key]);
      }
      let address = this.processAddress(builder.address);
      return address.update(build)
      .then(()=>{
        resolve();
      })
      .catch((error)=>{
        reject(error);
      });
    });
  },

  delete : function(builder){
    let wrath = require('./wrath');
    let address = this.processAddress(builder.address);
    let last = builder.lastType;
    if(last == 'doc'){
      return wrath.clearDoc(address);
    } else if(last == 'collection'){
      return wrath.clearCollection(address);
    }
  },

  commit : function(builder){

    return new Promise((resolve,reject)=>{

      if(builder.batchQueries.length === 0){
        reject("no queries to commit");
      }

      let batch = this.db.batch();
      for(var query of builder.batchQueries){
        let local = this.processAddress(query.address);
        if(query.opp == 'insert'){
          batch.set(local,query.object);
        }
        if(query.opp == 'update'){
          batch.update(local,query.object);
        }
        if(query.opp == 'delete'){
          batch.delete(local);
        }
        if(query.opp == 'increment'){
          let build = {};
          for(let key in query.object){
            build[key] = fieldvalue.increment(query.object[key]);
          }
          batch.update(local,build);
        }
      }

      return batch.commit()
      .then((d)=>{
        resolve();
      })
      .catch((error)=>{
        reject(error);
      });

    });
    //promise ends here

  }

}
