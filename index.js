String.prototype.clr = function (hexColor) { return `<font color='#${hexColor}'>${this}</font>` }
const path = require('path')
const fs = require('fs')
const dec = [7000,9000,11000,15000,20000]
const inc = [1000,1200,1500,2000,3000]
module.exports = function buffcd(mod) {
	
	function get_config() {
		const def = {
			"enabled": true,
			"ar": 0,
			"am": 0,
			"m": 0
		};

		try {
			return Object.assign({}, def, reload("./config"));
		}catch(e) {
			return def
		}
	}
	
	const { entity, player } = mod.require.library
	
	let buffs = reload('./lib/buffs.js'),
		sup = [], drt = 0, cdr = 0,
		config = get_config(),
		enabled = true,
		custom = false
		
	
	mod.game.initialize('inventory');
	mod.game.inventory.on('update', () => {
        try { sup = mod.game.inventory.equipment.slots['4'].passivitySets[0].passivities } catch (e) { sup = [], drt = 0, cdr = 0 }
		if (sup.length == 0) return
        if (sup[0] >= 5160215 && sup[0] <= 5160219) {
			drt = inc[(sup[0]+5)%10]
			cdr = dec[(sup[0]+5)%10]
		}
		else drt = cdr = 0
   })
	
	mod.hook('S_ABNORMALITY_BEGIN', '*', (event) => {
		if (!config.enabled) return
		if (event.target == mod.game.me.gameId) {
			if (player.playersInParty.has(event.source) && event.target != event.source) {
				let pbuff = buffs.find(obj => obj.id == event.id)
				if (pbuff) mod.setTimeout(abn,Number(event.duration)+50,icon(pbuff),calcdr(pbuff)-Number(event.duration)-100)
			} else {
				let buff = buffs.find(obj => obj.id == event.id)
			if (buff) mod.setTimeout(abn,Number(event.duration)+50,icon(buff),buff.cd-Number(event.duration)-cdr-100)
			}
		}
	})

	mod.command.add('buff', (p1,p2)=> {
		if (p1) p1 = p1.toLowerCase()
		if (p2) p2 = p2.toLowerCase()
		if (p1 == null) {
			config.enabled = !config.enabled
			mod.command.message('is ' + (config.enabled ? 'enabled'.clr('56B4E9') : 'disabled'.clr('E69F00')))
			JSONsave(config)
		} else if (p1 == 'reload') {
			buffs = reload('./lib/buffs.js')
			mod.command.message('data has been reloaded')
		} else if (p1 == 'ar') {
			if (p2 == 'reset') {
				config.ar = 0
				mod.command.message('adrenaline rush using default icon now')
				JSONsave(config)
				return
			}
			if (isNaN(p2)) {
				mod.command.message('arg must be a number')
			} else {
				config.ar = p2
				mod.command.message('custom icon for adrenaline rush set to: '+p2)
				JSONsave(config)
			}
		} else if (p1 == 'am') {
			if (p2 == 'reset') {
				config.am = 0
				mod.command.message('ancient mighty using default icon now')
				JSONsave(config)
				return
			}
			if (isNaN(p2)) {
				mod.command.message('arg must be a number')
			} else {
				config.am = p2
				mod.command.message('custom icon for ancient mighty set to: '+p2)
				JSONsave(config)
			}
		} else if (p1 == 'm') {
			if (p2 == 'reset') {
				config.m = 0
				mod.command.message('mighty using default icon now')
				JSONsave(config)
				return
			}
			if (isNaN(p2)) {
				mod.command.message('arg must be a number')
			} else {
				config.m = p2
				mod.command.message('custom icon for mighty set to: '+p2)
				JSONsave(config)
			}
		}
	})
	
	function abn(id, duration) {
        mod.send('S_ABNORMALITY_BEGIN', 5, {
            target: mod.game.me.gameId,
            source: mod.game.me.gameId,
            id: id,
            duration: duration,
            stacks: 1
        });
		mod.setTimeout(() => {
            mod.send('S_ABNORMALITY_END', 1, {
                target: mod.game.me.gameId,
                id: id
            });
        }, duration);
    }
	function icon(buff) {
		if (buff.type === "ancient mighty" && config.am != 0) return config.am
		else if (buff.type === "mighty" && config.m != 0) return config.m
		else if (buff.type === "party buff" && config.ar != 0) return config.ar
		else return buff.id
	}
	function calcdr(buff) {
		return Math.round((100-buff.cdr)*buff.cd/100)
	}
	function reload(fileName) {
		delete require.cache[require.resolve(fileName)]
		return require(fileName)
	}
	function JSONsave(obj) {
		if (Object.keys(obj).length) {
			try { fs.writeFileSync(path.join(__dirname,`./config.json`), JSON.stringify(obj, null, '\t')) }
			catch (err) { console.log(err); return false }
		}
	}
	this.destructor = function() {
		JSONsave(config)
	}
}