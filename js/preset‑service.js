/** preset-service.js
 * 原作者default‑cards.js适配桥接层，存储key带preset_前缀隔离业务数据
 */
import { getRawPresetSource } from "./preset-data-bridge.js";

const STORAGE_KEY_GROUP_OFF = "preset_dc_groups_off";
const STORAGE_KEY_CARD_OFF_PREFIX = "preset_dc-off-";

// 整组停用记录
function getGroupOffRecord(){
    try{
        const s = localStorage.getItem(STORAGE_KEY_GROUP_OFF);
        return s ? JSON.parse(s) : {};
    }catch{ return {}; }
}
function saveGroupOffRecord(obj){
    localStorage.setItem(STORAGE_KEY_GROUP_OFF, JSON.stringify(obj||{}));
}

// 单张卡片停用开关
function isCardOff(catKey, cardUniqueId){
    const k = STORAGE_KEY_CARD_OFF_PREFIX + catKey + ":" + cardUniqueId;
    return localStorage.getItem(k) === "1";
}
function setCardOff(catKey, cardUniqueId, off){
    const k = STORAGE_KEY_CARD_OFF_PREFIX + catKey + ":" + cardUniqueId;
    if(off) localStorage.setItem(k,"1");
    else localStorage.removeItem(k);
}

/**
 * 原作者分组格式 → AuditCardModule system.subgroups 格式
 * @returns {Array} subgroups数组
 */
export async function getAllConvertedPresetGroups(){
    const rawData = getRawPresetSource();
    const outSubgroups = [];
    let globalIdx = 0;
    for(const catKey of Object.keys(rawData)){
        const groupList = rawData[catKey];
        for(const [groupName, cardTextArr] of groupList){
            const subgroupId = `sys‑${catKey}‑${globalIdx++}`;
            const groupOffObj = getGroupOffRecord();
            const groupIsOff = !!(groupOffObj[catKey] && groupOffObj[catKey].includes(groupName));
            const cardList = cardTextArr.map((text,idx)=>{
                const cid = subgroupId + "-card‑" + idx;
                const disableFlag = groupIsOff || isCardOff(catKey,cid);
                return {
                    id: cid,
                    title: groupName,
                    content: text,
                    side:"bot",
                    isDisabled: disableFlag,
                    disabledBy:"system‑preset",
                    contactId:null
                };
            })
            outSubgroups.push({
                subgroupId: subgroupId,
                name: `【预设】${groupName}`,
                scope:"global",
                list: cardList
            })
        }
    }
    return outSubgroups;
}

export const PresetService = {
    getRawPresetSource:getRawPresetSource,
    getAllConvertedPresetGroups,
    getGroupOffRecord,
    saveGroupOffRecord,
    isCardOff,
    setCardOff
};
