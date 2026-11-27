/** quote-spell-service.js
 * 原作者 quote‑spell.js，词典拼字工具函数，无DOM
 */
export function quoteSpellDraw(cardList, opts={min:2,max:5,allowMixCustom:true}){
    const {min,max,allowMixCustom} = opts;
    const usable = cardList.filter(c=>!c.isDisabled);
    if(!usable.length) return [];
    const takeCount = Math.min(max, Math.max(min, Math.floor(Math.random()*(max-min+1)) + min));
    const res = [];
    const copy = [...usable];
    for(let i=0;i<takeCount && copy.length>0;i++){
        const rndIdx = Math.floor(Math.random()*copy.length);
        res.push(copy.splice(rndIdx,1)[0]);
    }
    return res;
}
