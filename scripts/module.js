//Dev mode integration
const MODULE_ID = "memento-mori";

Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(MODULE_ID);
});

function log(...args) {
    try {
        const isDebugging = game.modules.get('_dev-mode')?.api?.getPackageDebugValue(MODULE_ID);

        if (isDebugging) {
            console.log(MODULE_ID, '|', ...args);
        }
    } catch (e) {}
}

//settings
function getSetting(key){
    return game.settings.get(MODULE_ID, key)
}

Hooks.once('init', async function() {

    game.settings.register(MODULE_ID, "unlinkedStatusName",{
        name: "MEMENTO_MORI.Settings.UnlinkedStatusName.Name",
        hint: "MEMENTO_MORI.Settings.UnlinkedStatusName.Hint",
        scope: 'world',     // "world" = sync to db, "client" = local storage
        config: true,       // false if you dont want it to show in module config
        type: String,       // Number, Boolean, String,
        default: "Dead"
    })

    game.settings.register(MODULE_ID, "unlinkedStatusIcon",{
        name: "MEMENTO_MORI.Settings.UnlinkedStatusIcon.Name",
        hint: "MEMENTO_MORI.Settings.UnlinkedStatusIcon.Hint",
        scope: 'world',     // "world" = sync to db, "client" = local storage
        config: true,       // false if you dont want it to show in module config
        type: String,       // Number, Boolean, String,
        filePicker: "image",
        default: `modules/${MODULE_ID}/icons/pirate-grave.svg`
    })

    game.settings.register(MODULE_ID, "linkedStatusName",{
        name: "MEMENTO_MORI.Settings.LinkedStatusName.Name",
        hint: "MEMENTO_MORI.Settings.LinkedStatusName.Hint",
        scope: 'world',     // "world" = sync to db, "client" = local storage
        config: true,       // false if you dont want it to show in module config
        type: String,       // Number, Boolean, String,
        default: "Dying"
    })

    game.settings.register(MODULE_ID, "linkedStatusIcon",{
        name: "MEMENTO_MORI.Settings.LinkedStatusIcon.Name",
        hint: "MEMENTO_MORI.Settings.LinkedStatusIcon.Hint",
        scope: 'world',     // "world" = sync to db, "client" = local storage
        config: true,       // false if you dont want it to show in module config
        type: String,       // Number, Boolean, String,
        filePicker: "image",
        default: `modules/${MODULE_ID}/icons/bleeding-wound.svg`
    })

    game.settings.register(MODULE_ID, "overlay",{
        name: "MEMENTO_MORI.Settings.Overlay.Name",
        hint: "MEMENTO_MORI.Settings.Overlay.Hint",
        scope: 'world',     // "world" = sync to db, "client" = local storage
        config: true,       // false if you dont want it to show in module config
        type: Boolean,       // Number, Boolean, String,
        default: true
    })

    game.settings.register(MODULE_ID, "hitPath",{
        name: "MEMENTO_MORI.Settings.HitPath.Name",
        hint: "MEMENTO_MORI.Settings.HitPath.Hint",
        scope: 'world',     // "world" = sync to db, "client" = local storage
        config: true,       // false if you dont want it to show in module config
        type: String,       // Number, Boolean, String,
        default: "data.attributes.hp.value"
    })

    game.settings.register(MODULE_ID, "comparison",{
        name: "MEMENTO_MORI.Settings.comparison.Name",
        hint: "MEMENTO_MORI.Settings.comparison.Hint",
        scope: 'world',     // "world" = sync to db, "client" = local storage
        config: true,       // false if you dont want it to show in module config
        type: String,       // Number, Boolean, String,
        default: "lt",
        choices: {
            "lt": game.i18n.localize("MEMENTO_MORI.Settings.comparison.LT"), //Less than or equal to
            "gt": game.i18n.localize("MEMENTO_MORI.Settings.comparison.GT") //greater than or equal to
        }
    })

    game.settings.register(MODULE_ID, "compareTo",{
        name: "MEMENTO_MORI.Settings.CompareTo.Name",
        hint: "MEMENTO_MORI.Settings.CompareTo.Hint",
        scope: 'world',     // "world" = sync to db, "client" = local storage
        config: true,       // false if you dont want it to show in module config
        type: String,       // Number, Boolean, String,
        default: "0"
    })
});

async function addEffect(actor){
    log("Adding Effect to " + actor.name)
    if(actor.effects.find(e => e.data?.flags?.core?.statusId === MODULE_ID)) return //no new effect if one is already present
    let linked = actor.isToken ? "unlinked" : "linked"
    let label = getSetting(`${linked}StatusName`);
    let icon = getSetting(`${linked}StatusIcon`);
    let effect = {
        label,
        icon,
        flags: {
            core:{
                statusId: MODULE_ID,
                overlay: getSetting("overlay")
            }
        }
    }
    await actor.createEmbeddedDocuments("ActiveEffect", [effect])
}

async function removeEffects(actor){
    log("Removing Effect From" + actor.name)
    let effects = actor.effects.filter(e => e.data?.flags?.core?.statusId === MODULE_ID)
    if (effects.length===0) return
    for (let effect of effects) {
        await effect.delete()
    }
}

async function updateActor(actor, update){
    if(!game.user === game.users.find(u => u.isGM && u.active)) return //first GM only
    let hp = getProperty(update, getSetting("hitPath"))
    if(hp === undefined) {
        if(getProperty(actor.data, getSetting("hitPath"))===undefined) console.warn(`${MODULE_ID} | The setting ${game.i18n.localize("MEMENTO_MORI.Settings.HitPath.Name")} is not a valid property of actor.data or that property is undefined`)
        return
    }
    let compareTo = isNaN(parseInt(getSetting("compareTo"))) ? getProperty(actor.data, getSetting("compareTo")) : parseInt(getSetting("compareTo"))
    if (compareTo === undefined) {
        console.warn(`${MODULE_ID} | The setting ${game.i18n.localize("MEMENTO_MORI.Settings.compareTo.Name")} is not a number or a valid property of actor.data or that property is undefined`)
        return
    }
    let comparison = getSetting("comparison")
    let dead = false
    switch (comparison) {
        case "lt":
            dead = hp <= compareTo;
            break
        case "gt":
            dead = hp >= compareTo;
            break
    }
    if(dead) await addEffect(actor)
    if(!dead && hp) await removeEffects(actor) //only remove if not dead and if hp exists, to avoid false removal
}
Hooks.on("ready", () => {
    if (game.user.isGM) Hooks.on("updateActor", updateActor)
    log("Ready Hook Fired")
})
