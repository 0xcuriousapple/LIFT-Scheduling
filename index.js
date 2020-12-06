const HCL = require("js-hcl-parser");
const csv = require('csv-parser')
const fs = require('fs');
const util = require('util');
const { Engine } = require('json-rules-engine');
const { DEFAULT_ECDH_CURVE } = require("tls");
const { doesNotMatch } = require("assert");
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require("constants");

const pathToStates = "./states"

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

    let closestUpLevel = Number.MAX_VALUE;
    let closestDownLevel = Number.MAX_VALUE;

    for (let level in levelwise_situation) {
        if (levelwise_situation.hasOwnProperty(level)) {

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

    if (up == 0 & down == 0) return 'idle'
    if (up > down) return 'up';
    return 'down'
}

// if there is updown, go to the highest or loweat flooe , will have to work on up and down
// let x = levelwise_situation[lift_pos[lift_id]].direction;
function getPassengers(levelwise_situation, pos, direction, requiredPeople, load, movement) {

    let x = levelwise_situation[pos][direction];

    for (destination in x) {

        let temp = 0;
        x[destination].some((passenger) => {
            if (movement[destination] === undefined) movement[destination] = [];
            movement[destination].push(passenger)
            requiredPeople--;
            temp++;
            load++;
            if (requiredPeople == 0) return true;
        })
        x[destination].splice(0, temp);
        if (requiredPeople == 0) break;
    }

    levelwise_situation[pos][direction] = x;
    return load;
}

function movelift(lift_id, lift_pos, movement) {

}
function allotPassengersToLift(lift_pos, levelwise_situation, load, MAX_LEVEL, MIN_LEVEL, MAX_CAPACITY) {

    // decide passengers, and route

    // DISABLEd PROIORTIY

    let movement = {

    }
    while (load < 3) {


    }

}

function movelift(lift_id, lifts_pos, movement, dir, load) {

    // up dir
    if (dir == 'up') {
        for (let i = lifts_pos[lift_id]; i <= MAX_LEVEL; i++) {
            if (movement.hasOwnProperty(i)) {
                load = stopToExit(movement, i);
            }
            if (load < MAX_CAPACITY)
        }
    }
    for (let i = 0 )
}


function startLift(id, lifts_pos, levelwise_situation) {
    let movement = {}
    let dir = decideDirectionOfLift(id, levelwise_situation, lifts_pos);

    // Get Passengers of Initial Level
    let load = getPassengers(levelwise_situation, lifts_pos[id], dir, MAX_CAPACITY, movement)
    movelift(lift_id, lifts_pos, movement, dir, load)
}

function scheduleJobs(state) {

    let levelwise_situation = {}
    let lifts_pos = {}

    //grouping - to add childern clasue here
    groupPassengers(state['passenger'], levelwise_situation);

    // create lift ds
    state['lift'].forEach((lift) => createLiftDS(lift, lifts_pos))

    //decide directions of lift 

    for (id in lifts_pos) {
        console.log(id, lifts_pos[id]);
        let dir = decideDirectionOfLift(id, levelwise_situation, lifts_pos);

        if (dir == 'up') {
            for
        }
        for (let i = 0 )
    }




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
