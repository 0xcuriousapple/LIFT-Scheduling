

// Node Modules
const HCL = require("js-hcl-parser");
const csv = require('csv-parser')
const fs = require('fs');
const util = require('util');


// Constants
const pathToStates = "./states/"
const pathToRules = "./rules/"
const MAX_CAPACITY = 3;
const MAX_LEVEL = 25;
const MIN_LEVEL = 1;
let passengersData = [];

// Promisifying fs methods, Reason : optimiztion of initiateLiftSystem() 
const readFile = util.promisify(fs.readFile);
const readdir = util.promisify(fs.readdir);


// Things Lift Admin can see at any time and set them
let Instructions = {}
let Intent = {} // This shoudnt be needed, we can remove it by refactoring code
let rules = {}


// Destination folder name : To decide withrespect to rules used
let FolderName = "WithOutRules";



// // 
// A1

// let Parent 

// C45
// P['ID'] = ID, OWN,DESTINATION
// P1

// OP-1

// PC-
async function initiateRulesEngine(rules) {
    //names = await fs.readdir("path/to/dir");
    let Promises = []
    let filenames = await readdir(pathToRules);
    filenames.forEach((filename) => {
        Promises.push(new Promise((resolve, reject) => {
            readFile(pathToRules + filename, 'utf-8').then((rule, error) => {

                let json = JSON.parse(rule);
                if (json.isRuleActive) {
                    if (FolderName.length + json.ruleName.length < 255) {
                        if (FolderName == "WithOutRules") FolderName = "With";
                        FolderName = FolderName + json.ruleName;
                    }
                    rules[json.ruleName] = json.rule;
                }

                resolve();
            })
        }))
    })
    await Promise.all(Promises)
}



// To get all data ready so we dont process it again and again
async function initiateLiftSystem(states, passengersData) {

    //names = await fs.readdir("path/to/dir");
    let Promises = []

    let filenames = await readdir(pathToStates);
    filenames.forEach((filename) => {
        Promises.push(new Promise((resolve, reject) => {
            readFile(pathToStates + filename, 'utf-8').then((state, error) => {
                states[filename.slice(0, -4)] = HCL.parse(state);
                resolve();
            })
        }))
    })

    Promises.push(new Promise((resolve, reject) => {
        fs.createReadStream('passengers.csv')
            .pipe(csv({ separator: '\t' }))
            .on('data', (data) => {

                passengersData[data['id']] = {
                    'health': data['health'],
                    'age': parseInt(data['age']),
                    'familyId': parseInt(data['family_id']),
                }
                resolve();
            })
    }))

    await Promise.all(Promises)
}


function disabledFilter(passenger_id) {

    if (rules['ProrityToDisabled'] != undefined && passengersData[passenger_id].health == rules['ProrityToDisabled']["disablePersonIdentifier"]) {
        return true;
    }
    else {
        return false;
    }
}

function safeChildernFilter(passenger_id) {
    //console.log(passenger_id)
    if (rules['SafeChildern'] != undefined && passengersData[passenger_id]["age"] <= rules['SafeChildern']["minAge"]) {
        return true;
    }
    else {
        return false;
    }
}

function createlevelDS(p, d, levelwise_situation, passenger_id) {

    let disablefilter = disabledFilter(passenger_id)

    // if (disablefilter) console.log(disablefilter, passenger_id);
    if (levelwise_situation[p] === undefined) {
        levelwise_situation[p] = { "up": {}, "down": {}, "disabledUp": {}, "disabledDown": {} };
    }
    if (d > p) {

        if (disablefilter) {
            if (levelwise_situation[p]["disabledUp"][d] === undefined) levelwise_situation[p]["disabledUp"][d] = [];
            levelwise_situation[p]["disabledUp"][d].push(passenger_id);
        }
        else {
            if (levelwise_situation[p]["up"][d] === undefined) levelwise_situation[p]["up"][d] = [];
            levelwise_situation[p]["up"][d].push(passenger_id);
        }

    }
    else {
        if (disablefilter) {
            if (levelwise_situation[p]["disabledDown"][d] === undefined) levelwise_situation[p]["disabledDown"][d] = [];
            levelwise_situation[p]["disabledDown"][d].push(passenger_id);
        }
        else {
            if (levelwise_situation[p]["down"][d] === undefined) levelwise_situation[p]["down"][d] = [];
            levelwise_situation[p]["down"][d].push(passenger_id);
        }
    }
}

// This function, can be extended if we want to assign level wise Priority as well 
// Disabled Persons at First in queue
function SortbyPriorityToDisabledPeople(levelwise_situation) {

    // console.log('\nSortingHappening')
    for (level in levelwise_situation) {

        for (destination in levelwise_situation[level]['disabledDown']) {
            levelwise_situation[level]['down'][destination] = levelwise_situation[level]['disabledDown'][destination].concat(levelwise_situation[level]['down'][destination]);
        }
        for (destination in levelwise_situation[level]['disabledUp']) {
            levelwise_situation[level]['up'][destination] = levelwise_situation[level]['disabledUp'][destination].concat(levelwise_situation[level]['up'][destination]);
        }
    }

}
function groupPassengers(state, levelwise_situation) {

    state.forEach((job) => {
        let d = job["goto_level"];
        let p = job["at_level"];
        createlevelDS(p, d, levelwise_situation, job["id"]);
    }
    )
}


function createLiftDS(lift, lifts_pos) {
    lifts_pos[lift['id']] = lift['at_level'];
}

Object.size = function (obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};
// uper ke up, niche ke down
function decideDirectionOfLift(lift_id, levelwise_situation, lifts_pos) {

    let straightUp = 0;
    let straightDown = 0;

    let upThenDown = 0;
    let downThenUp = 0;


    // Sorry Zan, Here this tight coupling of disabled people shouuld have beeen avoided, but this time limit is not allowing me too
    let disabledPeopleStraightUp = 0;
    let disabledPeopleStraightDown = 0;

    let disabledPeopleUpThenDown = 0;
    let disabledPeopleDownThenUp = 0;

    for (let level in levelwise_situation) {
        //console.log(level);
        if (levelwise_situation.hasOwnProperty(level)) {


            if (level == lifts_pos[lift_id]) {
                straightDown += Object.size(levelwise_situation[level].down)
                straightUp += Object.size(levelwise_situation[level].up)

                disabledPeopleStraightDown += Object.size(levelwise_situation[level].disabledDown)
                disabledPeopleStraightUp += Object.size(levelwise_situation[level].disabledUp)
            }
            else if (level < lifts_pos[lift_id]) {
                straightDown += Object.size(levelwise_situation[level].down)
                downThenUp += Object.size(levelwise_situation[level].up)

                disabledPeopleStraightDown += Object.size(levelwise_situation[level].disabledDown)
                disabledPeopleDownThenUp += Object.size(levelwise_situation[level].disabledUp)
            }
            else if (level > lifts_pos[lift_id]) {
                straightUp += Object.size(levelwise_situation[level].up)
                upThenDown += Object.size(levelwise_situation[level].down)


                disabledPeopleStraightUp += Object.size(levelwise_situation[level].disabledUp)
                disabledPeopleUpThenDown += Object.size(levelwise_situation[level].disabledDown)
            }
        }
    }

    // //This can also be wrote clean
    // console.log(straightUp, straightDown, straight)
    if (straightUp == 0 && straightDown == 0 && upThenDown == 0 && downThenUp == 0) return 'idle'
    if (disabledPeopleStraightUp > disabledPeopleStraightDown) return 'up';
    else if (disabledPeopleStraightUp != disabledPeopleStraightDown) return 'down';
    else if (disabledPeopleUpThenDown > disabledPeopleUpThenDown) return 'up';
    else if (disabledPeopleUpThenDown != disabledPeopleUpThenDown) return 'down';
    else if (straightUp > straightDown) return 'up';
    else if (straightUp != straightDown) return 'down';
    else if (upThenDown > downThenUp) return 'up';
    else return 'down';
}

let goSolo = {};
function decisionForChildern(passenger_id, movement, destination) {

    // console.log('\nmovement-----', movement);
    let parentfound = false;
    movement[destination].forEach((passengerInsideLift) => {
        if (passengersData[passenger_id].familyId == passengersData[passengerInsideLift].familyId) {
            parentfound = true;
        }
    })
    if (parentfound) {
        return "Safe"
    }
    if (Object.size(movement) == 1) {
        requiredPeople = 0;

        // console.log("goSolo");
        return "goSolo";
    }

    return "wait";

}
// let x = levelwise_situation[lift_pos[lift_id]].direction;
function stopForEntry(levelwise_situation, pos, direction, requiredPeople, load, movement, lift_id, lift_pos) {


    //no stop as no waiting here
    if (levelwise_situation[pos] === undefined || levelwise_situation[pos][direction] === undefined || Object.size(levelwise_situation[pos][direction]) == 0) return load;

    let x = levelwise_situation[pos][direction];
    let temp = 0;
    let toBeDeletedLevels = [];
    // console.log("\nBefore", x);
    // console.log("\n Movement", movement);
    // console.log("--------------------------------")
    lift_pos[lift_id] = pos;
    Instructions[lift_id].push('STOP ' + pos)
    //console.log(x);
    for (destination in x) {
        x[destination].some((passenger) => {
            if (movement[destination] === undefined) movement[destination] = [];
            //console.log(passenger);
            let decision = "NA"

            // console.log(safeChildernFilter(passenger), passengersData[passenger]["age"]);
            if (safeChildernFilter(passenger)) {
                decision = decisionForChildern(passenger, movement, destination);
            }

            if (decision == 'wait') {

            }
            else if (decision == 'goSolo') {

                // console.log('gosolo');
                movement[destination].push(passenger)
                Instructions[lift_id].push("PASSENGER " + passenger + " ENTER")
                requiredPeople = 0;
                goSolo[passenger] = true;
                temp++;
                load = MAX_CAPACITY;
                if (requiredPeople == 0) return true;
            }
            else { // FOR PARENT FOUND OR NA CASE


                movement[destination].push(passenger)
                Instructions[lift_id].push("PASSENGER " + passenger + " ENTER")
                requiredPeople--;
                temp++;
                load++;
                if (requiredPeople == 0) return true;
            }


        })
        x[destination].splice(0, temp);
        if (x[destination].length == 0) toBeDeletedLevels.push(destination);
        temp = 0;
        if (requiredPeople == 0) break;
    }


    toBeDeletedLevels.forEach((level) => {
        delete x[level];
    })
    // console.log("\nAfter", x);
    levelwise_situation[pos][direction] = x;
    return load;
}

function stopForExit(lift_id, movement, i) {

    let flag = false;
    Instructions[lift_id].push('STOP ' + i)
    movement[i].forEach((passenger) => {
        Instructions[lift_id].push("PASSENGER " + passenger + " LEAVE");

        // Childern Go Solo Case
        if (goSolo[passenger] == true) {
            // console.log("sadsaasas---------------------------------------------");
            flag = true;
            goSolo[passenger] = false;
        }
    })


    let freed_load = movement[i].length
    delete movement[i];


    if (flag) {
        freed_load = MAX_CAPACITY;
    }
    return freed_load;
}

let test = 1;

function movelift(levelwise_situation, lift_id, lifts_pos, movement, dir, load) {

    // up dir
    let start_point = lifts_pos[lift_id];
    if (dir == 'up') {

        for (let i = start_point; i <= MAX_LEVEL; i++) {

            if (movement.hasOwnProperty(i)) {

                lifts_pos[lift_id] = i;
                load = load - stopForExit(lift_id, movement, i);

            }
            if (load < MAX_CAPACITY) {
                // lifts_pos[lift_id] = i;

                load = stopForEntry(levelwise_situation, i, "up", MAX_CAPACITY - load, load, movement, lift_id, lifts_pos)
            }
        }



    }
    //down dir
    if (dir == 'down') {


        for (let i = start_point; i >= MIN_LEVEL; i--) {


            if (movement.hasOwnProperty(i)) {
                lifts_pos[lift_id] = i;
                load = load - stopForExit(lift_id, movement, i);

            }
            if (load < MAX_CAPACITY) {
                // lifts_pos[lift_id] = i;
                load = stopForEntry(levelwise_situation, i, "down", MAX_CAPACITY - load, load, movement, lift_id, lifts_pos)
            }
        }
    }

    console.log(lifts_pos);
    // startLift(delegateWork(lift_id, lifts_pos), lifts_pos, levelwise_situation);
    if (test == 1) {
        test++;
        startLift(1, lifts_pos, levelwise_situation);
    }
}

function delegateWork(prev_one, lifts_pos) {

    let t = (prev_one + 1) % (Object.size(lifts_pos) + 1);

    if (t == 0) {
        return 1;
    }
    else {
        return t;
    }

}


function startLift(id, lifts_pos, levelwise_situation) {
    let movement = {}
    let dir = decideDirectionOfLift(id, levelwise_situation, lifts_pos);

    console.log(dir);
    console.log(JSON.stringify(levelwise_situation));
    //Get Passengers of Initial Level
    if (dir == 'idle') {

    }
    else {
        if (Instructions[id] === undefined) Instructions[id] = [];
        Instructions[id].push('GO ' + dir.toUpperCase());
        let load = stopForEntry(levelwise_situation, lifts_pos[id], dir, MAX_CAPACITY, 0, movement, id, lifts_pos)


        if (Intent[id] === undefined) Intent[id] = [];
        Intent[id] = dir.toUpperCase();
        movelift(levelwise_situation, id, lifts_pos, movement, dir, load)
    }
}

function scheduleJobs(state) {

    let levelwise_situation = {}
    let lifts_pos = {}

    //grouping - to add childern clasue here
    groupPassengers(state['passenger'], levelwise_situation);
    // console.log("--------------------------------------------------")
    // console.log(levelwise_situation['1'].up);

    // sorting : Giving Priority to Disabled people
    if (rules['ProrityToDisabled'] !== undefined) SortbyPriorityToDisabledPeople(levelwise_situation);

    console.log(JSON.stringify(levelwise_situation));
    // create lift ds
    state['lift'].forEach((lift) => createLiftDS(lift, lifts_pos))


    startLift(delegateWork(0, lifts_pos), lifts_pos, levelwise_situation);

    // for (lift_id in lifts_pos) {
    //     if (lifts_pos[lift_id] != 1) { goToGround(lift_id) }
    //     if (Instructions[lift_id][Instructions[lift_id].length - 1] == "GO DOWN") { Instructions[lift_id].push('STOP 1') }
    // }
}


function goToGround(lift_id) {

    if (Intent = 'UP') Instructions[lift_id].push('GO DOWN')
    Instructions[lift_id].push('STOP 1')
}
function output() {
    for (lift_id in Instructions) {
        Instructions[lift_id].forEach((Instruction) => {
            console.log('\nLIFT ' + lift_id + ":" + " " + Instruction)
        })

        console.log('\n');
    }
}

function storeFiles(state_file) {
    var dir = './instructions/' + FolderName;
    if (!fs.existsSync(dir, { recursive: true })) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(`${dir}/${state_file}.json`, JSON.stringify(Instructions));

}
async function run() {


    let states = {};


    await initiateRulesEngine(rules);
    await initiateLiftSystem(states, passengersData);

    let i = 1;

    for (state_file in states) {
        if (state_file == 'state_3') {
            scheduleJobs(JSON.parse(states[state_file]));
            output();
            storeFiles(state_file);
            Instructions = {};
            Intent = {}
            i++;
        }
    }
    // states.forEach((state) => {


    // });


}
run();
// console.log(process.argv)
