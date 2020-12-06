const HCL = require("js-hcl-parser");
const csv = require('csv-parser')
const fs = require('fs');
const util = require('util');
const { Engine } = require('json-rules-engine');


const pathToStates = "./states"

const MAX_CAPACITY = 3;
const MAX_LEVEL = 25;
const MIN_LEVEL = 1;

let states = [];
let passengersData = [];

const readFile = util.promisify(fs.readFile);
const readdir = util.promisify(fs.readdir);

// function setupRules() {
//     let engine = new Engine()



// To get all data ready so we dont process it again and again
async function initiateLiftSystem() {

    //names = await fs.readdir("path/to/dir");
    let Promises = []

    let filenames = await readdir(pathToStates);
    filenames.forEach((filename) => {
        Promises.push(new Promise((resolve, reject) => {
            readFile(pathToStates + "/" + 'state_9.hcl', 'utf-8').then((state, error) => {
                states.push(HCL.parse(state));
                resolve();
            })
        }))
    })

    Promises.push(new Promise((resolve, reject) => {
        fs.createReadStream('passengers.csv')
            .pipe(csv({ separator: '\t' }))
            .on('data', (data) => {

                passengersData[data['id']] = {
                    'isDisabled': data['health'] == 'disabled' ? true : false,
                    'isChildern': parseInt(data['age']),
                    'fam_id': parseInt(data['family_id']),
                }
                resolve();
            })
    }))

    await Promise.all(Promises)
}

function createlevelDS(p, d, levelwise_situation, passenger_id) {
    if (levelwise_situation[p] === undefined) {
        levelwise_situation[p] = { "up": {}, "down": {} };
    }
    if (d > p) {
        if (levelwise_situation[p]["up"][d] === undefined) levelwise_situation[p]["up"][d] = [];
        levelwise_situation[p]["up"][d].push(passenger_id);

    }
    else {
        if (levelwise_situation[p]["down"][d] === undefined) levelwise_situation[p]["down"][d] = [];
        levelwise_situation[p]["down"][d].push(passenger_id);
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

    let up = 0;
    let down = 0;



    for (let level in levelwise_situation) {
        if (levelwise_situation.hasOwnProperty(level)) {

            // console.log("\n upC" + up)
            // console.log("\nlevel" + level)
            // console.log("\nup" + JSON.stringify(levelwise_situation[level].up))
            // console.log("\ndOWN" + JSON.stringify(levelwise_situation[level].down))

            if (level == lifts_pos[lift_id]) {
                down += Object.size(levelwise_situation[level].down)
                up += Object.size(levelwise_situation[level].up)
            }
            else if (level < lifts_pos[lift_id]) {
                down += Object.size(levelwise_situation[level].down)
            }
            else if (level > lifts_pos[lift_id]) {
                up += Object.size(levelwise_situation[level].up)
            }
        }
    }
    console.log("\nUp and Down" + up + " " + down)
    if (up == 0 & down == 0) return 'idle'
    if (up > down) return 'up';
    return 'down'
}

// if there is updown, go to the highest or loweat flooe , will have to work on up and down
// let x = levelwise_situation[lift_pos[lift_id]].direction;
function stopForEntry(levelwise_situation, pos, direction, requiredPeople, load, movement) {


    //no stop as no waiting here
    if (levelwise_situation[pos] === undefined || levelwise_situation[pos][direction] === undefined) return load;

    let x = levelwise_situation[pos][direction];
    let temp = 0;

    let toBeDeletedLevels = [];
    for (destination in x) {
        x[destination].some((passenger) => {
            if (movement[destination] === undefined) movement[destination] = [];
            movement[destination].push(passenger)

            console.log("\nPassenger" + passenger + "Entry" + "at" + pos)
            requiredPeople--;
            temp++;
            load++;
            if (requiredPeople == 0) return true;
        })
        x[destination].splice(0, temp);
        if (x[destination].length == 0) toBeDeletedLevels.push(destination);
        temp = 0;
        if (requiredPeople == 0) break;
    }


    toBeDeletedLevels.forEach((level) => {
        delete x[level];
    })
    levelwise_situation[pos][direction] = x;
    return load;
}

function stopForExit(movement, i) {

    movement[i].forEach((passenger) => { console.log("\nPassenger" + passenger + "Exit" + "at" + i) })

    let freed_load = movement[i].length
    delete movement[i];
    return freed_load;

}



function movelift(levelwise_situation, lift_id, lifts_pos, movement, dir, load) {

    // up dir
    if (dir == 'up') {


        let start_point = lifts_pos[lift_id];
        for (let i = start_point; i <= MAX_LEVEL; i++) {


            if (movement.hasOwnProperty(i)) {
                lifts_pos[lift_id] = i;
                load = load - stopForExit(movement, i);
                console.log("asdsad" + load);
            }
            if (load < MAX_CAPACITY) {
                lifts_pos[lift_id] = i;
                load = stopForEntry(levelwise_situation, i, "up", MAX_CAPACITY - load, load, movement)
            }
        }

        console.log(JSON.stringify(levelwise_situation))
        startLift(lift_id, lifts_pos, levelwise_situation);
    }

    //down dir
    if (dir == 'down') {


        let start_point = lifts_pos[lift_id];
        for (let i = start_point; i >= MIN_LEVEL; i--) {


            if (movement.hasOwnProperty(i)) {
                lifts_pos[lift_id] = i;
                load = load - stopForExit(movement, i);
                console.log("asdsad" + load);
            }
            if (load < MAX_CAPACITY) {
                lifts_pos[lift_id] = i;
                load = stopForEntry(levelwise_situation, i, "down", MAX_CAPACITY - load, load, movement)
            }
        }
        console.log(JSON.stringify(levelwise_situation))
        startLift(lift_id, lifts_pos, levelwise_situation);
    }
}


function startLift(id, lifts_pos, levelwise_situation) {
    let movement = {}
    let dir = decideDirectionOfLift(id, levelwise_situation, lifts_pos);

    console.log(dir);
    //Get Passengers of Initial Level
    if (dir == 'idle') {
        console.log('done-----')
    }
    else {
        let load = stopForEntry(levelwise_situation, lifts_pos[id], dir, MAX_CAPACITY, 0, movement)
        movelift(levelwise_situation, id, lifts_pos, movement, dir, load)
    }
}

function scheduleJobs(state) {

    let levelwise_situation = {}
    let lifts_pos = {}

    //grouping - to add childern clasue here
    groupPassengers(state['passenger'], levelwise_situation);

    // create lift ds
    state['lift'].forEach((lift) => createLiftDS(lift, lifts_pos))

    //decide directions of lift 
    // console.log(levelwise_situation[1]['up']);
    for (let level in levelwise_situation) {

    }


    // console.log(levelwise_situation)
    startLift(1, lifts_pos, levelwise_situation);
    // decideDirectionOfLift(1, levelwise_situation, lifts_pos);


    // console.log(levelwise_situation[1]);


    // getPassengers(levelwise_situation, 1, "up", 3);
    // console.log(levelwise_situation[1]);
    // // Allot Lift


}
async function run() {
    await initiateLiftSystem();
    // console.log(states);
    // states.forEach(scheduleJobs);z

    scheduleJobs(JSON.parse(states[3]));

}
run();
// console.log(process.argv)
