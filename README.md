# wett-firestore

this is a plugin for wett db api, it gives you firebase-admin access to the firestore db, you can use the firebase-admin object as a global variable in node js with firebase varibale name this firebase app is initialized with cred and db_url params passed in wett db init as object parameters
        
# Installtion

```cmd
npm i wett-firestore
```

```javascript
global.engine = require("wett");
const wett_firestore = require("wett_firestore");

function main(){
    
    let install = await engine.db().install(wett_firestore);
    if(install instanceof engine.common.Error){
        return install.now("failed-install-wett-firebase-plugin").log();
    }

    let init = await engine.db("firestore").init({
        name:'firestore',
        cred:require('./daachi_firestore_key.json'),
        url:require('./dbUrl.json').daachi
    });
    if(init instanceof engine.common.Error){
        return init.now("init failed").log(log);
    }
    
}

```

## supported apis

1. get
2. insert
3. update
4. increment - only works in integer fields
5. delete - not optimized for < 100 documents
6. batch - does not support batch reads
7. exists - check if doc exists
