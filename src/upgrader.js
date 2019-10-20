var upgradertime = {}

function work(creep) {
    const memory = creep.memory
    if (memory.status == 'going') {
        let target = Game.getObjectById(memory.missionid)
        if (creep.pos.getRangeTo(target) > 1) {
            creep.moveTo(target, {reusePath: 10})
        } else {
            memory.status = 'upgrading'
            creep.signController(creep.room.controller, '☕')
        }
    } else if (memory.status == 'upgrading') {
        let target = Game.getObjectById(memory.missionid)
        let container = Game.getObjectById(memory.container)
        if (!container) {
            container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: obj => obj.structureType == STRUCTURE_CONTAINER
            })
            if (container) memory.container = container.id
        } else if (creep.carry.energy <= 40 && container.store.energy > 0) {
            creep.withdraw(container, RESOURCE_ENERGY)
            upgradertime[creep.pos.roomName] = Game.time
        }
        const action = creep.upgradeController(target)
        if (action == ERR_NOT_IN_RANGE) {
            creep.moveTo(target)
        } else if (action == ERR_NOT_ENOUGH_RESOURCES) {
            memory.status = 'getting'
        } else if (action == OK) {
            memory._move = undefined
        }
    }
    if (memory.status == 'getting') {
        upgradertime[creep.pos.roomName] = Game.time
        let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: obj => {
                if (creep.room.controller.level >= 6) {
                    return obj.structureType == STRUCTURE_CONTAINER
                } else {
                    return (obj.structureType == STRUCTURE_LINK && obj.energy > 0)
                        || (obj.structureType == STRUCTURE_TOWER && obj.energy > 0)
                        || (obj.structureType == STRUCTURE_STORAGE && obj.store[RESOURCE_ENERGY] > 5e4)
                        || (obj.structureType == STRUCTURE_CONTAINER && obj.store[RESOURCE_ENERGY] > 1e3)
                }
            }

        })
        if (target) {
            if (creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target)
            }
        }
        if (creep.carry.energy >= creep.carryCapacity) {
            memory.status = 'upgrading';
        }
    }
}

function born(spawnnow, creepname, memory) {
    let body = {
        'work': 40,
        'carry': 4,
        'move': 6
    }
    if (Game.getObjectById(memory.controller).level >= 8) {
        body = {
            'work': 15,
            'carry': 4,
            'move': 5
        }
    } else if (Game.getObjectById(memory.controller).level <= 4) {
        body = {
            'work': 16,
            'move': 8,
            'carry': 12
        }
    }
    let bodyarray = require('tools').generatebody(body, spawnnow)
    return spawnnow.spawnCreep(
        bodyarray,
        creepname,
        {
            memory: {
                status: 'going',
                missionid: memory.controller
            }
        }
    )
}

function miss(room) {
    let role_num_fix = Game.config.role_num_fix
    role_num_fix[room.name] = role_num_fix[room.name] || {}
    if (room.storage && room.controller.level >= 4 && room.controller.level <= 7) {

        if (room.storage.store[RESOURCE_ENERGY] / room.storage.store.getCapacity() < 0.3) {
            role_num_fix[room.name].upgrader = 0
        } else if (room.storage.store[RESOURCE_ENERGY] / room.storage.store.getCapacity() < 0.4) {
            role_num_fix[room.name].upgrader = 1
        } else if (room.storage.store[RESOURCE_ENERGY] / room.storage.store.getCapacity() < 0.5) {
            role_num_fix[room.name].upgrader = 2
        } else if (room.storage.store[RESOURCE_ENERGY] / room.storage.store.getCapacity() >= 0.6) {
            role_num_fix[room.name].upgrader = 3
        }
    }
    if (room.controller.level >= 8) {
        if (role_num_fix[room.name].upgrader >= 2) {
            role_num_fix[room.name].upgrader = 1
        }
        if (room.controller.ticksToDowngrade && room.controller.ticksToDowngrade > 100000) {
            role_num_fix[room.name].upgrader = 0
        }else{
            role_num_fix[room.name].upgrader = 1
        }
    } else {
        role_num_fix[room.name].upgrader = 1
    }

    if (room.controller.ticksToDowngrade && room.controller.ticksToDowngrade < 3000 && role_num_fix[room.name].upgrader == 0) {
        role_num_fix[room.name].upgrader = 1
    }
    if (room.storage && room.storage.store[RESOURCE_ENERGY] / room.storage.store.getCapacity() >= 0.98) {
        role_num_fix[room.name].upgrader = 1
    }

    // if (room.name == 'E29N38') {
    //     console.log('E29N38 upgrader=' + role_num_fix[room.name].upgrader)
    // }
    return role_num_fix[room.name].upgrader
}

module.exports = {
    'work': work,
    'born': born,
    'miss': miss,
    'upgradertime': upgradertime
};