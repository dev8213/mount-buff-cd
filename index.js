String.prototype.clr = function (hexColor) { return `<font color='#${hexColor}'>${this}</font>` }
const path = require('path')
const fs = require('fs')
const dec = [7000,9000,11000,15000,20000]
const inc = [1000,1200,1500,2000,3000]
module.exports = function buffcd(mod) {
	
	function get_config() {
		const def = {
			"enabled": true,
			"show_arush_cd": false,
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
		retreat = true,
		custom = false
		
	
	mod.game.initialize('inventory');
	mod.game.inventory.on('update', () => {
		try { sup = mod.game.inventory.equipment.slots['4'].passivitySets[0].passivities } catch (e) { sup = [], drt = 0, cdr = 0; retreat = true }
		if (sup.length == 0) return
		if (sup[0] >= 5160215 && sup[0] <= 5160219) {
			drt = inc[(sup[0]+5)%10]
			cdr = dec[(sup[0]+5)%10]
		} else if (sup[0] >= 5160263 && sup[0] <= 5160267) {
			retreat = false
		} else { drt = cdr = 0; retreat = true }
	})
	
	mod.hook('S_ABNORMALITY_BEGIN', '*', (event) => {
		if (!config.enabled) return
		if (event.target == mod.game.me.gameId) {
			if (player.playersInParty.has(event.source) && event.target != event.source) {
				if (!config.show_arush_cd) return
				let pbuff = buffs.find(obj => obj.id == event.id)
				if (pbuff) {
					abn_end(icon(pbuff))
					abn_start(event.id,Number(event.duration))
					mod.setTimeout(abn_start,Number(event.duration)+50,icon(pbuff),calcdr(pbuff)-Number(event.duration)-100)
					return false
				}
			} else {
				let buff = buffs.find(obj => obj.id == event.id)
				if (buff) {
					abn_end(icon(buff))
					abn_start(event.id,Number(event.duration))
					mod.setTimeout(abn_start,Number(event.duration)+50,icon(buff),buff.cd-Number(event.duration)-cdr-100)
					return false
				}
			}
		}
	})

	mod.command.add('buff', (p1,p2)=> {
		if (p1) p1 = p1.toLowerCase()
		if (p2) p2 = p2.toLowerCase()
		if (p1 == null) {
			config.enabled = !config.enabled
			mod.command.message(config.enabled ? 'Enabled'.clr('56B4E9') : 'Disabled'.clr('E69F00'))
			JSONsave(config)
		} else if (p1 == 'reload') {
			buffs = reload('./lib/buffs.js')
			mod.command.message('data has been reloaded')
		} else if (p1 == 'ar') {
			if (!p2) {
				config.show_arush_cd = !config.show_arush_cd
				mod.command.message('Arush CD ' + (config.show_arush_cd ? 'Shown'.clr('56B4E9') : 'Hidden'.clr('E69F00')))
				JSONsave(config)
				return
			}
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
	
	function abn_start(id, duration) {
		mod.send('S_ABNORMALITY_BEGIN', 5, {
			target: mod.game.me.gameId,
			source: mod.game.me.gameId,
			id: id,
			duration: duration,
			stacks: 1
		})
		mod.setTimeout(abn_end,duration,id)
	}
	function abn_end(id) {
		mod.send('S_ABNORMALITY_END', 1, {
			target: mod.game.me.gameId,
			id: id
		})
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