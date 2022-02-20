String.prototype.clr = function (hexColor) { return `<font color='#${hexColor}'>${this}</font>` }
const path = require('path')
const fs = require('fs')
const dec = [7000,9000,11000,15000,20000]
const inc = [1000,1200,1500,2000,3000]
module.exports = function mountcrit(mod) {
	
	let mounts = reloadJS('./lib/mounts.js'),
		sup = [], drt = 0, cdr = 0,
		enabled = true
	
	mod.game.initialize('inventory');
	//5160215 5160216 5160217 5160218 5160219
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
		if (event.target != mod.game.me.gameId) return
		let mount = mounts.find(obj => obj.id == event.id)
		if (mount) mod.setTimeout(abn,Number(event.duration)+50,mount.icon,mount.cd-Number(event.duration)-cdr-100)
	})

	mod.command.add('buff', (p1)=> {
		if (p1) p1 = p1.toLowerCase()
		if (p1 == null) {
			enabled = !enabled
			mod.command.message('is ' + (enabled ? 'enabled'.clr('56B4E9') : 'disabled'.clr('E69F00')))
		} else if (p1 == 'reload') {
			mounts = reloadJS('./lib/mounts.js')
			mod.command.message('data has been reloaded')
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
	function reloadJS(fileName) {
		delete require.cache[require.resolve(fileName)]
		return require(fileName)
	}
}