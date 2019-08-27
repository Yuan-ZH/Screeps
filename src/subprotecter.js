function born(spawnnow, creepname, memory) {
    let bodyparts = require('tools').generatebody({
        'tough': 4,
        'attack': 10,
        'ranged_attack': 10,
        'move': 25,
        'heal': 1
    }, spawnnow)
    return spawnnow.spawnCreep(
        bodyparts,
        creepname,
        {
            memory: {
                status: 'fight',
                missionid: memory.roomName,
            }
        }
    )
}


function work(creep) {

    if (creep.memory.status == 'sleep') {
        if (Game.time % 10 == 0) {
            creep.memory.status = 'fight'
        }
    } else if (creep.memory.status == 'fight') {
        let target = require('tools').findroomselsefilter(Game.rooms[creep.memory.missionid], FIND_HOSTILE_CREEPS, {
            filter: obj => {
                return require('whitelist').whitelist.indexOf(obj.owner.username) == -1
            }
        })[0]
        if (target) {
            if (creep.attack(target) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target)
            }
            if (creep.pos.getRangeTo(target) <= 1) {
                creep.rangedMassAttack()
            } else {
                creep.rangedAttack(target)
            }
        } else if (creep.getActiveBodyparts('heal') && (target = creep.pos.findClosestByPath(FIND_MY_CREEPS, {filter: obj => obj.hits < obj.hitsMax}))) {
            const act=creep.heal(target)
            if(act==ERR_NOT_IN_RANGE){
                creep.moveTo(target)
            }
        } else {
            creep.memory.status = 'sleep'
        }
    }


}

module.exports = {
    'work': work,
    'born': born,
};