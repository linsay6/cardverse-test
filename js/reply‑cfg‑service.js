/** reply-cfg-service.js
 * 原作者reply‑settings配置读写，独立存储前缀
 */
const PREFIX = "preset_reply_";
export function getReplyCfg(key,defVal){
    const s = localStorage.getItem(PREFIX+key);
    if(s===null) return defVal;
    const num = Number(s);
    return isNaN(num) ? s : num;
}
export function setReplyCfg(key,val){
    localStorage.setItem(PREFIX+key,String(val));
}
export const ReplyCfgService = {getReplyCfg,setReplyCfg};
