/** quote-spell-service.js【新建文件】
 * 移植原作者 quote‑spell.js，纯业务函数，页面无关，供聊天模块调用
*/
export function quoteSpellDraw(cardList, opts={min:2,max:5,allowMixCustom:true}){
    const {min,max,allowMixCustom} = opts;
    const usable = cardList.filter(c=>!c.isDisabled);
    if(!usable.length) return [];
    const takeCount = Math.min(max, Math.max(min, Math.floor(Math.random()*(max‑min+1)) + min));
    const res = [];
    const copy = [...usable];
    for(let i=0;i<takeCount && copy.length>0;i++){
        const rndIdx = Math.floor(Math.random()*copy.length);
        res.push(copy.splice(rndIdx,1)[0]);
    }
    return res;
}
