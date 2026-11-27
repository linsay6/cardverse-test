/** preset-data-bridge.js
 * 原作者 default‑cards‑data.js，静态只读预设数据源
 */
export const DEFAULT_CARD_DATA = {
  "main":[
    ["生活碎片",["刚刚整理了一下东西","今天收拾了一下房间"]]
    // 这里后续粘贴完整原作者全套预设字卡JSON
  ],
  "kaomoji":[],
  "emoji":[],
  "touch":[],
  "dict":[],
  "fish":[],
  "garden":[],
  "sync":[],
  "reach":[],
  "water":[],
  "piggy":[],
  "eat":[],
  "period":[],
  "room":[],
  "cjian":[],
  "drift":[],
  "music":[]
};

export function getRawPresetSource(){
  return JSON.parse(JSON.stringify(DEFAULT_CARD_DATA));
}
