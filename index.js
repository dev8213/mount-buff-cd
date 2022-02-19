const path = require('path')
const fs = require('fs')
const dec = [11000,15000,20000]
const inc = [1500,2000,3000]
module.exports = function mountcrit(mod) {
	
	let mounts = reloadJS('./lib/mounts.js'),
		sup, drt = 0, cdr = 0
	
	mod.game.initialize('inventory');
	//5160217 5160218 5160219
	mod.game.inventory.on('update', () => {
        try { sup = mod.game.inventory.equipment.slots['4'].passivitySets[0].passivities } catch (e) { sup = [], drt = 0, cdr = 0 }
        for (let i = 0; i < sup?.length; i++) {
            if (sup[i] >= 5160217 && sup[i] <= 5160219) {
				drt = dec[(sup[i]+3)%10]
				cdr = inc[(sup[i]+3)%10]
			}
        }
   })
	
	mod.hook('S_ABNORMALITY_BEGIN', '*', (event) => {
		if (event.target != mod.game.me.gameId) return
		let mount = mounts.find(obj => obj.id == event.id)
		if (mount) mod.setTimeout(abn,Number(event.duration)+drt+100,mount.id,mount.cd-Number(event.duration)-drt-cdr-200)
	})
	function abn(buff, duration) {
        mod.send('S_ABNORMALITY_BEGIN', 5, {
            target: mod.game.me.gameId,
            source: mod.game.me.gameId,
            id: buff,
            duration: duration,
            stacks: 1
        });

        mod.setTimeout(() => {
            mod.send('S_ABNORMALITY_END', 1, {
                target: mod.game.me.gameId,
                id: buff
            });
        }, duration);
    }
	function reloadJS(fileName) {
		delete require.cache[require.resolve(fileName)]
		return require(fileName)
	}
}