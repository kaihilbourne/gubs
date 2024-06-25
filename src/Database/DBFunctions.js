import { getDatabase, ref, set, get, child } from 'firebase/database';

export function createRoom(uname,gameroom){
    const db = getDatabase();
    const refe = ref(db,"rooms/"+gameroom);
    get(child(refe, '/unames')).then((snapshot) => {
        if (snapshot.exists()) {
            let temp = snapshot.val();
            temp[temp.length] = uname;
            // snapshot.val()[snapshot.val().length] = uname;
            set(refe, {
                unames: temp,
                started: false
            });
            alert(snapshot.val());
        } else {
            set(refe, {
                    unames: [uname],
                    started: false
                });
        }
    }).catch((error) => {
        console.error(error);
    });
    
  }